import { ethers } from 'ethers'
import {
  BATCH_WRITER_ABI,
  EC_REGISTRY_ABI,
  EC_REGISTRY_MAP_ABI,
  TRAIT_IMPLEMENTER_ABI,
} from './abis'
import { callToRequestData } from './encoder'
import { ExtendedConfig } from './config'
import {
  Achievement,
  AchievementsByIDs,
  AchievementWithMappedID,
  PlayerStruct,
  TeamStruct,
} from './types'
import { AdapterError, Logger } from '@chainlink/ea-bootstrap'

export const getEncodedCallsResult = async (
  jobRunID: string,
  playerAchievements: Achievement[],
  teamAchievements: Achievement[],
  config: ExtendedConfig,
): Promise<string> => {
  const groupedAchievements = getGroupedAchievementsByID(playerAchievements, teamAchievements)
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const { teams, players } = await getPlayerAndTeamMaps(provider, config)
  const calls: string[][] = []

  let hasHitLimit = false
  let encodedCalls = ''
  const achievementIDs = Object.keys(groupedAchievements).sort((a, b) => parseInt(a) - parseInt(b))
  const batchWriter = new ethers.Contract(config.batchWriterAddress, BATCH_WRITER_ABI, provider)
  const ecRegistry = new ethers.Contract(config.ecRegistryAddress, EC_REGISTRY_ABI, provider)

  const lastProcessedInfo = await getIdxLastProcessedAchievementID(achievementIDs, batchWriter)
  let currAchievementIdIdx = lastProcessedInfo.idx
  while (!hasHitLimit && currAchievementIdIdx < achievementIDs.length) {
    const achievementID = achievementIDs[currAchievementIdIdx]
    if (await ecRegistry.addressCanModifyTrait(config.batchWriterAddress, achievementID)) {
      const encodedCall = await getSetDataEncodedCall(
        provider,
        teams,
        players,
        groupedAchievements,
        achievementID,
        ecRegistry,
      )
      calls.push([config.ecRegistryAddress, encodedCall])
      const { encodedCalls: updatedEncodedCalls, hasHitLimit: hasCallsHitLimit } =
        await updateEncodedCalls(jobRunID, achievementID, calls, batchWriter)
      hasHitLimit = hasCallsHitLimit
      if (!hasHitLimit) {
        encodedCalls = updatedEncodedCalls
      }
    }
    currAchievementIdIdx++
  }
  const lastProcessedID = lastProcessedInfo.lastProcessedID
  validateEncodedCallsNotEmpty(jobRunID, lastProcessedID, encodedCalls)
  return encodedCalls
}

const validateEncodedCallsNotEmpty = (
  jobRunID: string,
  lastProcessedID: string,
  encodedCalls: string,
) => {
  if (encodedCalls.length === 0) {
    throw new AdapterError({
      jobRunID,
      statusCode: 500,
      message: `Got empty encoded results when resuming from achievementID ${lastProcessedID}`,
    })
  }
}

const updateEncodedCalls = async (
  jobRunID: string,
  achievementID: string,
  calls: string[][],
  batchWriter: ethers.Contract,
): Promise<{
  hasHitLimit: boolean
  encodedCalls: string
}> => {
  const encodedCalls = callToRequestData(calls, parseInt(achievementID))
  let hasHitLimit = false
  try {
    const gasCostEstimate = await batchWriter.estimateGas.fulfillBytes(
      ethers.utils.formatBytes32String(jobRunID),
      `0x${encodedCalls}`,
    )
    Logger.info(
      `Successfully estimated gas ${gasCostEstimate.toString()} for processing achievementID ${achievementID}`,
    )
  } catch (e) {
    if (e.code === 'UNPREDICTABLE_GAS_LIMIT') {
      hasHitLimit = true
      Logger.info(`Hit gas limit when processing achievementID ${achievementID}`)
    } else {
      throw new AdapterError({
        jobRunID,
        message: e.message,
        statusCode: 500,
      })
    }
  }
  return {
    encodedCalls,
    hasHitLimit,
  }
}

const getIdxLastProcessedAchievementID = async (
  sortedAchievementIDs: string[],
  batchWriter: ethers.Contract,
): Promise<{
  idx: number
  lastProcessedID: string
}> => {
  const lastProcessedID = await batchWriter.LastDataRecordId()
  const lastProcessedIDIdx = sortedAchievementIDs.findIndex(
    (achievementID) => achievementID === lastProcessedID.toString(),
  )
  if (lastProcessedIDIdx < 0) {
    Logger.info(`Cannot find achievementID ${lastProcessedID}.  Will process all achievements`)
    return {
      idx: 0,
      lastProcessedID: lastProcessedID.toString(),
    }
  }
  return {
    idx: lastProcessedIDIdx,
    lastProcessedID: lastProcessedID.toString(),
  }
}

const getSetDataEncodedCall = async (
  provider: ethers.providers.JsonRpcProvider,
  teams: TeamStruct[],
  players: PlayerStruct[],
  groupedAchievements: AchievementsByIDs,
  achievementID: string,
  ecRegistry: ethers.Contract,
): Promise<string> => {
  const achievements = getAchievementsWithMappedIDs(
    teams,
    players,
    groupedAchievements,
    achievementID,
  )
  if (isOnlyBooleanValues(groupedAchievements[achievementID].map(({ value }) => value))) {
    return getSetDataEncodedCallForOnlyBooleanAchievement(ecRegistry, achievements, achievementID)
  }
  return await getSetDataEncodedCallForMixedValueAchievement(
    provider,
    ecRegistry,
    achievements,
    achievementID,
  )
}

const getAchievementsWithMappedIDs = (
  teams: TeamStruct[],
  players: PlayerStruct[],
  groupedAchievements: AchievementsByIDs,
  achievementID: string,
): AchievementWithMappedID[] => {
  return groupedAchievements[achievementID].map(({ team_id, player_id, ...rest }) => {
    let mappedID
    if (team_id) {
      const team = teams.find((t) => t.real_id.toString() === team_id.toString())
      if (!team) {
        throw new Error(`Cannot match team ID ${team_id} with response from ECRegistryMap`)
      }
      mappedID = team.id
    } else if (player_id) {
      const player = players.find((p) => p.real_id.toString() === player_id.toString())
      if (!player) {
        throw new Error(`Cannot match player ID ${team_id} with response from ECRegistryMap`)
      }
      mappedID = player.id
    } else {
      throw new Error('Missing player and team IDs')
    }
    return {
      ...rest,
      mappedID: mappedID,
    }
  })
}

const isOnlyBooleanValues = (values: (number | boolean)[]): boolean => {
  for (const value of values) {
    if (typeof value !== 'boolean') return false
  }
  return true
}

// Data in ECRegistry is stored in a BitMap which means we need
// to load existing data, check for differences and only update the
// new key uint8's that have been changed
// https://github.com/ethercards/ec-chain-batch-execute/blob/master/tests/batchWriter.ts#L228
const getSetDataEncodedCallForOnlyBooleanAchievement = async (
  ecRegistry: ethers.Contract,
  updatedAchievements: AchievementWithMappedID[],
  achievementID: string,
): Promise<string> => {
  const pageNumber = 0
  const numPageRecords = updatedAchievements.length
  const oldValues = await ecRegistry.getData(achievementID, pageNumber, numPageRecords)
  const valueDifferences: number[] = []
  const valueDifferenceIDs: number[] = []
  for (let z = 0; z < updatedAchievements.length; z++) {
    const boolAsNum = typeof updatedAchievements[z].value === 'boolean' ? 1 : 0
    if (oldValues[z] !== boolAsNum) {
      valueDifferenceIDs.push(updatedAchievements[z].mappedID)
      valueDifferences.push(boolAsNum)
    }
  }
  return ecRegistry.interface.encodeFunctionData('setData', [
    parseInt(achievementID),
    valueDifferenceIDs,
    valueDifferences,
  ])
}

const getSetDataEncodedCallForMixedValueAchievement = async (
  provider: ethers.providers.JsonRpcProvider,
  ecRegistry: ethers.Contract,
  achievements: AchievementWithMappedID[],
  achievementID: string,
): Promise<string> => {
  const { implementer: implementerAddress } = await ecRegistry.traits(achievementID)
  const implementer = new ethers.Contract(implementerAddress, TRAIT_IMPLEMENTER_ABI, provider)
  return implementer.interface.encodeFunctionData('setData', [
    achievements.map((a) => a.mappedID),
    achievements.map(({ value }) => (typeof value === 'boolean' ? (value ? 1 : 0) : value)),
  ])
}

const getGroupedAchievementsByID = (
  playerAchievements: Achievement[],
  teamAchievements: Achievement[],
): AchievementsByIDs => {
  let result: AchievementsByIDs = {}
  result = groupAchievements(playerAchievements, result)
  return groupAchievements(teamAchievements, result)
}

const groupAchievements = (
  achievements: Achievement[],
  achievementsByID: AchievementsByIDs,
): AchievementsByIDs => {
  return achievements.reduce((acc, curr) => {
    const { achievement_id } = curr
    if (!acc[achievement_id]) {
      acc[achievement_id] = []
    }
    acc[achievement_id].push(curr)
    return acc
  }, achievementsByID)
}

const getPlayerAndTeamMaps = async (
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
