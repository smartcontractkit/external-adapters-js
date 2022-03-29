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
  GalaxisContracts,
  GetSetDataEncodedCallParams,
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
  const { provider, ecRegistry, ecRegistryMap, batchWriter } = initContracts(config)
  const { teams, players } = await getPlayerAndTeamMaps(ecRegistryMap)
  const calls: string[][] = []
  let hasHitLimit = false
  let encodedCalls = ''
  const achievementIDs = Object.keys(groupedAchievements)
    .map(Number)
    .sort((a, b) => a - b)
  const lastProcessedInfo = await getIdxOfFirstAchievementToProcess(
    achievementIDs,
    groupedAchievements,
    batchWriter,
  )
  let currAchievementIdIdx = lastProcessedInfo.startAchievementIdx
  let startingEventIdx = lastProcessedInfo.startEventIdx
  while (!hasHitLimit && currAchievementIdIdx < achievementIDs.length) {
    const achievementID = achievementIDs[currAchievementIdIdx]
    if (await ecRegistry.addressCanModifyTrait(config.batchWriterAddress, achievementID)) {
      groupedAchievements[achievementID] = groupedAchievements[achievementID].sort(
        (a, b) => a.event_id - b.event_id,
      )
      for (let i = startingEventIdx + 1; i <= groupedAchievements[achievementID].length; i++) {
        const { encodedCall, lastProcessedEventID, implementerAddress } =
          await getSetDataEncodedCall({
            provider,
            teams,
            players,
            groupedAchievements,
            achievementID,
            ecRegistry,
            ecRegistryMap,
            startEventIdx: startingEventIdx,
            endEventIdx: i,
          })

        // Mixed value achievements need to call the implementerAddress else call the ECRegistryAddress
        const addressToCall = implementerAddress || config.ecRegistryAddress
        calls.push([addressToCall, encodedCall])
        const { encodedCalls: updatedEncodedCalls, hasHitLimit: hasCallsHitLimit } =
          await updateEncodedCalls(
            jobRunID,
            achievementID,
            calls,
            batchWriter,
            lastProcessedEventID,
          )
        hasHitLimit = hasCallsHitLimit
        if (hasHitLimit) {
          Logger.info(
            `Hit gas limit when trying to process achievementID ${achievementID} and eventID ${lastProcessedEventID}`,
          )
          break
        } else {
          encodedCalls = updatedEncodedCalls
          const hasAchievementBeenFullyProcessed = groupedAchievements[achievementID].length === i
          if (!hasAchievementBeenFullyProcessed) {
            // If achievement has not been processed then we pop the last element from the calls array
            // and then try populate it again with the next achievement event in the next iteration
            calls.pop()
          }
        }
      }
    }
    startingEventIdx = 0
    currAchievementIdIdx++
  }
  const startEventID = lastProcessedInfo.lastProcessedEventID
  validateEncodedCallsNotEmpty(jobRunID, startEventID, encodedCalls)
  return encodedCalls
}

const initContracts = (config: ExtendedConfig): GalaxisContracts => {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const batchWriter = new ethers.Contract(config.batchWriterAddress, BATCH_WRITER_ABI, provider)
  const ecRegistry = new ethers.Contract(config.ecRegistryAddress, EC_REGISTRY_ABI, provider)
  const ecRegistryMap = new ethers.Contract(
    config.ecRegistryMapAddress,
    EC_REGISTRY_MAP_ABI,
    provider,
  )
  return {
    provider,
    batchWriter,
    ecRegistry,
    ecRegistryMap,
  }
}

const validateEncodedCallsNotEmpty = (
  jobRunID: string,
  lastProcessedID: number,
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
  achievementID: number,
  calls: string[][],
  batchWriter: ethers.Contract,
  eventID: number,
): Promise<{
  hasHitLimit: boolean
  encodedCalls: string
}> => {
  const encodedCalls = callToRequestData(calls, eventID)
  let hasHitLimit = false
  try {
    const gasCostEstimate = await batchWriter.estimateGas.fulfillBytes(
      ethers.utils.formatBytes32String(jobRunID),
      `0x${encodedCalls}`,
    )
    Logger.info(
      `Successfully estimated gas ${gasCostEstimate.toString()} for processing achievementID ${achievementID} and eventID ${eventID}`,
    )
  } catch (e) {
    if (e.code === 'UNPREDICTABLE_GAS_LIMIT') {
      hasHitLimit = true
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

const getIdxOfFirstAchievementToProcess = async (
  sortedAchievementIDs: number[],
  groupedAchievements: AchievementsByIDs,
  batchWriter: ethers.Contract,
): Promise<{
  startEventIdx: number
  startAchievementIdx: number
  lastProcessedEventID: number
}> => {
  const lastProcessedEventID = await batchWriter.LastDataRecordId()
  const {
    achievementID: lastProcessedAchievementID,
    achievementIDIdx: lastProcessedAchievementIDIdx,
  } = findLastProcessedAchievementID(
    sortedAchievementIDs,
    lastProcessedEventID,
    groupedAchievements,
  )
  if (!lastProcessedAchievementID) {
    Logger.info(`Cannot find achievementID ${lastProcessedEventID}.  Will process all achievements`)
    return {
      startAchievementIdx: 0,
      startEventIdx: 0,
      lastProcessedEventID,
    }
  }
  const sortedAchievementEventIDs = groupedAchievements[lastProcessedAchievementID]
    .map((a) => a.event_id)
    .sort((a, b) => a - b)
  const lastProcessedEventIDIdx = sortedAchievementEventIDs.indexOf(lastProcessedEventID)
  const hasAchievementBeenFullyProcessed =
    lastProcessedEventIDIdx === sortedAchievementEventIDs.length - 1
  if (hasAchievementBeenFullyProcessed) {
    return {
      startEventIdx: 0,
      startAchievementIdx: lastProcessedAchievementIDIdx + 1,
      lastProcessedEventID: lastProcessedEventID,
    }
  }
  return {
    startEventIdx: lastProcessedEventIDIdx + 1,
    startAchievementIdx: lastProcessedAchievementIDIdx,
    lastProcessedEventID: lastProcessedEventID,
  }
}

const findLastProcessedAchievementID = (
  sortedAchievementIDs: number[],
  lastProcessedEventID: number,
  groupedAchievements: AchievementsByIDs,
): { achievementID: number | undefined; achievementIDIdx: number } => {
  const lastProcessedAchievementID = sortedAchievementIDs.find((achievementID) =>
    hasEvent(achievementID, lastProcessedEventID, groupedAchievements),
  )
  const lastProcessedAchievementIDIdx = sortedAchievementIDs.findIndex(
    (achievementID) => achievementID === lastProcessedAchievementID,
  )
  return {
    achievementID: lastProcessedAchievementID,
    achievementIDIdx: lastProcessedAchievementIDIdx,
  }
}

const hasEvent = (
  achievementID: number,
  lastProcessedEventID: number,
  groupedAchievements: AchievementsByIDs,
): boolean => {
  const achievements = groupedAchievements[achievementID]
  for (const { event_id } of achievements) {
    if (event_id === lastProcessedEventID) {
      return true
    }
  }
  return false
}

const getSetDataEncodedCall = async (
  params: GetSetDataEncodedCallParams,
): Promise<{
  encodedCall: string
  lastProcessedEventID: number
  implementerAddress?: string
}> => {
  const {
    provider,
    teams,
    players,
    groupedAchievements,
    achievementID,
    ecRegistry,
    ecRegistryMap,
    startEventIdx,
    endEventIdx,
  } = params
  const achievements = getAchievementsWithMappedIDs(
    teams,
    players,
    groupedAchievements,
    achievementID,
  ).slice(startEventIdx, endEventIdx)
  let encodedCall
  let implementerAddress
  if (isOnlyBooleanValues(groupedAchievements[achievementID].map(({ value }) => value))) {
    encodedCall = await getSetDataEncodedCallForOnlyBooleanAchievement(
      ecRegistry,
      ecRegistryMap,
      achievements,
      achievementID,
    )
  } else {
    const {
      encodedCall: mixedValueEncodedCall,
      implementerAddress: achievementImplementerAddress,
    } = await getSetDataEncodedCallForMixedValueAchievement(
      provider,
      ecRegistry,
      achievements,
      achievementID,
    )
    ;(encodedCall = mixedValueEncodedCall), (implementerAddress = achievementImplementerAddress)
  }
  return {
    encodedCall,
    lastProcessedEventID: achievements[achievements.length - 1].event_id,
    implementerAddress,
  }
}

const getAchievementsWithMappedIDs = (
  teams: TeamStruct[],
  players: PlayerStruct[],
  groupedAchievements: AchievementsByIDs,
  achievementID: number,
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
  ecRegistryMap: ethers.Contract,
  updatedAchievements: AchievementWithMappedID[],
  achievementID: number,
): Promise<string> => {
  const pageNumber = 0
  const numPageRecords = await ecRegistryMap.playerCount()
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
    achievementID,
    valueDifferenceIDs,
    valueDifferences,
  ])
}

const getSetDataEncodedCallForMixedValueAchievement = async (
  provider: ethers.providers.JsonRpcProvider,
  ecRegistry: ethers.Contract,
  achievements: AchievementWithMappedID[],
  achievementID: number,
): Promise<{
  encodedCall: string
  implementerAddress: string
}> => {
  const { implementer: implementerAddress } = await ecRegistry.traits(achievementID)
  const implementer = new ethers.Contract(implementerAddress, TRAIT_IMPLEMENTER_ABI, provider)
  const encodedCall = implementer.interface.encodeFunctionData('setData', [
    achievements.map((a) => a.mappedID),
    achievements.map(({ value }) => (typeof value === 'boolean' ? (value ? 1 : 0) : value)),
  ])
  return {
    encodedCall,
    implementerAddress,
  }
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
  ecRegistryMap: ethers.Contract,
): Promise<{ teams: TeamStruct[]; players: PlayerStruct[] }> => {
  const teams = await ecRegistryMap.getTeams()
  const players = await ecRegistryMap.getPlayers()
  return {
    teams,
    players,
  }
}
