import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ExtendedConfig } from '../config'
import { ethers } from 'ethers'
import { EC_REGISTRY_ABI } from './abis'
import { ByteArray } from '@ethercards/ec-util'

export const supportedEndpoints = ['nba']

export interface Achievement {
  team_id?: number
  player_id?: number
  achievement_id: number
  value: boolean
}

export interface ResponseSchema {
  data: {
    player_achievements: Achievement[]
    team_achievements: Achievement[]
  }
}

const customError = (data: Record<string, unknown>) => data.Response === 'Error'

export const description = ''

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request)
  const jobRunID = validator.validated.id
  const options = config.api
  const response = await Requester.request<ResponseSchema>(options, customError)
  const { encodedCalls, hasMore } = await getFilteredAchievements(response.data, config)

  return {
    jobRunID,
    result: encodedCalls,
    statusCode: 200,
    data: {
      result: encodedCalls,
      hasMore,
    },
  }
}

export interface FilteredAchievements {
  encodedCalls: string
  hasMore: boolean
}

export const getFilteredAchievements = async (
  response: ResponseSchema,
  config: ExtendedConfig,
): Promise<FilteredAchievements> => {
  const groupedAchievements = getGroupedAchievementsByID(response)
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const ecRegistry = new ethers.Contract(config.ecRegistryAddress, EC_REGISTRY_ABI, provider)
  const calls: string[][] = []

  let hasHitLimit = false
  let encodedCalls = ''

  const achievementIDs = Object.keys(groupedAchievements)
  let currAchievementIdIdx = 0
  while (!hasHitLimit && currAchievementIdIdx < achievementIDs.length) {
    const achievementID = achievementIDs[currAchievementIdIdx]
    if (await ecRegistry.addressCanModifyTrait(config.batchWriterAddress, achievementID)) {
      const values = groupedAchievements[achievementID].map(({ value }) => value)
      const ids = groupedAchievements[achievementID].map(
        ({ team_id, player_id }) => team_id || player_id,
      )
      calls.push([
        config.ecRegistryAddress,
        ecRegistry.interface.encodeFunctionData('setData', [achievementID, ids, values]),
      ])
      const updatedEncodedCalls = encodeAchievements(calls)
      if (updatedEncodedCalls.length <= config.maxEncodedCallsBytes) {
        encodedCalls = updatedEncodedCalls
      } else {
        hasHitLimit = true
      }
    }
    currAchievementIdIdx++
  }
  return {
    encodedCalls: encodedCalls,
    hasMore: hasHitLimit,
  }
}

export interface AchievementsByIDs {
  [T: string]: Achievement[]
}

export const getGroupedAchievementsByID = (response: ResponseSchema): AchievementsByIDs => {
  let result: AchievementsByIDs = {}
  const { player_achievements, team_achievements } = response.data
  result = groupAchievements(player_achievements, result)
  return groupAchievements(team_achievements, result)
}

export const groupAchievements = (
  achievements: Achievement[],
  achievementsByID: AchievementsByIDs,
): AchievementsByIDs => {
  return achievements.reduce((acc, curr) => {
    const { achievement_id } = curr
    if (!acc[achievement_id]) {
      acc[achievement_id] = []
    }
    acc[achievement_id.toString()].push(curr)
    return acc
  }, achievementsByID)
}

export const encodeAchievements = (calls: string[][]): string => {
  let bytes = ''
  const header = new ByteArray(Buffer.alloc(2))
  // add call num
  header.writeUnsignedShort(calls.length)
  bytes = header.toString('hex')

  for (let i = 0; i < calls.length; i++) {
    const callLen = callLentoHex(removeZeroX(calls[i][1]).length)
    const address = addresstoCallData(calls[i][0])
    const callData = removeZeroX(calls[i][1])
    const packet = callLen + address + callData

    bytes += packet
  }
  return bytes
}

const removeZeroX = (str: string): string => {
  return str.replace('0x', '')
}

const addresstoCallData = (str: string): string => {
  return '000000000000000000000000' + removeZeroX(str)
}

const callLentoHex = (num: number): string => {
  const data = new ByteArray(Buffer.alloc(2))
  data.writeUnsignedShort(num / 2)
  return removeZeroX(data.toString('hex'))
}
