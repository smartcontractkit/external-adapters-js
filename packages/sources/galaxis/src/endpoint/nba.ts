import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ExtendedConfig } from '../config'
import { ethers } from 'ethers'
import { EC_REGISTRY_ABI, EC_REGISTRY_MAP_ABI } from './abis'

export const supportedEndpoints = ['nba']

export interface Achievement {
  team_id?: number
  player_id?: number
  achievement_id: number
  value: boolean
}

export interface ResponseSchema {
  player_achievements: Achievement[]
  team_achievements: Achievement[]
}

export interface TeamStruct {
  id: number
  name: string
  city: string
  tricode: string
  real_id: ethers.BigNumber
}

export interface PlayerStruct {
  id: number
  team_id: number
  real_id: ethers.BigNumber
  real_team_id: ethers.BigNumber
  full_name: string
}

const customError = (data: Record<string, unknown>) => data.Response === 'Error'

export const description =
  'This endpoint fetches a list of achievements for NBA teams and players and returns them as an encoded value'

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request)
  const jobRunID = validator.validated.id
  const options = config.api
  const response = await Requester.request<ResponseSchema>(options, customError)
  const encodedCalls = await getFilteredAchievements(response.data, config)

  const decoded = ethers.utils.defaultAbiCoder.decode(['string[][]', 'bool'], encodedCalls)
  console.log(decoded)

  return {
    jobRunID,
    result: encodedCalls,
    statusCode: 200,
    data: {
      result: encodedCalls,
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
): Promise<string> => {
  const groupedAchievements = getGroupedAchievementsByID(response)
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const { teams, players } = await getPlayerAndTeamMaps(provider, config)
  const ecRegistry = new ethers.Contract(config.ecRegistryAddress, EC_REGISTRY_ABI, provider)
  const calls: string[][] = []

  let hasHitLimit = false
  let encodedCalls = ''

  const achievementIDs = Object.keys(groupedAchievements)
  let currAchievementIdIdx = 0
  while (!hasHitLimit && currAchievementIdIdx < achievementIDs.length) {
    const achievementID = achievementIDs[currAchievementIdIdx]
    if (await ecRegistry.addressCanModifyTrait(config.batchWriterAddress, achievementID)) {
      const values = groupedAchievements[achievementID].map(({ value }) => (value ? 1 : 0))
      const ids = groupedAchievements[achievementID].map(({ team_id, player_id }) => {
        if (team_id) {
          const team = teams.find((t) => t.real_id.toString() === team_id.toString())
          if (!team) {
            throw new Error(`Cannot match team ID ${team_id} with response from ECRegistryMap`)
          }
          return team.id
        } else if (player_id) {
          const player = players.find((p) => p.real_id.toString() === player_id.toString())
          if (!player) {
            throw new Error(`Cannot match player ID ${team_id} with response from ECRegistryMap`)
          }
          return player.id
        } else {
          throw new Error('Missing player and team IDs')
        }
      })
      calls.push([
        config.ecRegistryAddress,
        ecRegistry.interface.encodeFunctionData('setData', [parseInt(achievementID), ids, values]),
      ])
      const updatedEncodedCalls = ethers.utils.defaultAbiCoder.encode(['string[][]'], [calls])
      if (updatedEncodedCalls.length <= config.maxEncodedCallsBytes) {
        encodedCalls = updatedEncodedCalls
      }
      hasHitLimit = updatedEncodedCalls.length > config.maxEncodedCallsBytes
    }
    currAchievementIdIdx++
  }
  return encodedCalls + ethers.utils.defaultAbiCoder.encode(['bool'], [hasHitLimit]).substring(2) // Strip out 0x
}

export interface AchievementsByIDs {
  [T: string]: Achievement[]
}

export const getGroupedAchievementsByID = (response: ResponseSchema): AchievementsByIDs => {
  let result: AchievementsByIDs = {}
  const { player_achievements, team_achievements } = response
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

export const getPlayerAndTeamMaps = async (
  provider: ethers.providers.JsonRpcProvider,
  config: ExtendedConfig,
): Promise<{ teams: TeamStruct[]; players: PlayerStruct[] }> => {
  const ecRegistryMap = new ethers.Contract(
    config.ecRegistryMapAddress,
    EC_REGISTRY_MAP_ABI,
    provider,
  )
  const teams = await ecRegistryMap.getTeams()
  const players = await ecRegistryMap.getPlayers()
  return {
    teams,
    players,
  }
}
