import { ethers } from 'ethers'
import { TRAIT_IMPLEMENTER_ABI } from './abis'
import { updateEncodedCalls } from './encoder'
import { ExtendedConfig } from './config'
import {
  Achievement,
  AchievementsByIDs,
  AchievementWithMappedID,
  GetSetDataEncodedCallParams,
  LastProcessedInfo,
  PlayerStruct,
  ProcessAchievementParams,
  ProcessAllAchievementParams,
  ProcessedEventInfo,
  TeamStruct,
} from './types'
import { AdapterError, Logger } from '@chainlink/ea-bootstrap'
import { BitArray } from '@ethercards/ec-util'

export const getEncodedCallsResult = async (
  jobRunID: string,
  playerAchievements: Achievement[],
  teamAchievements: Achievement[],
  config: ExtendedConfig,
  date: string,
): Promise<string> => {
  const groupedAchievements = getGroupedAchievementsByID(playerAchievements, teamAchievements)
  const { teams, players } = await getPlayerAndTeamMaps(config.ecRegistryMap)
  const sortedAchievementIDs = Object.keys(groupedAchievements)
    .map(Number)
    .sort((a, b) => a - b)
  const lastProcessedInfo = await getLastProcessedInformation(
    sortedAchievementIDs,
    groupedAchievements,
    config.batchWriter,
  )
  const encodedCalls = await processAllAchievements(
    {
      jobRunID,
      date,
      teams,
      players,
      groupedAchievements,
      sortedAchievementIDs,
      lastProcessedInfo,
    },
    config,
  )
  const startEventID = lastProcessedInfo.lastProcessedEventID
  validateEncodedCallsNotEmpty(jobRunID, startEventID, encodedCalls)
  return encodedCalls
}

const processAllAchievements = async (
  params: ProcessAllAchievementParams,
  config: ExtendedConfig,
): Promise<string> => {
  const {
    jobRunID,
    date,
    teams,
    players,
    groupedAchievements,
    sortedAchievementIDs,
    lastProcessedInfo,
  } = params
  const calls: string[][] = []
  const procesedEventIDs: ProcessedEventInfo[] = []
  let hasHitLimit = false
  let encodedCalls = ''
  let { startEventIdx, startAchievementIdx: currAchievementIdIdx } = lastProcessedInfo
  while (!hasHitLimit && currAchievementIdIdx < sortedAchievementIDs.length) {
    const achievementID = sortedAchievementIDs[currAchievementIdIdx]
    if (await config.ecRegistry.addressCanModifyTrait(config.batchWriter.address, achievementID)) {
      const processedAchievementResult = await processSingleAchievement(
        {
          jobRunID,
          achievementID,
          groupedAchievements,
          config,
          teams,
          players,
          date,
          startEventIdx,
        },
        procesedEventIDs,
        calls,
      )
      hasHitLimit = processedAchievementResult.hasHitLimit
      encodedCalls = processedAchievementResult.encodedCalls
    }

    // Reset startEventIdx to 0 as we want to process the first event of the next achievement
    startEventIdx = 0
    currAchievementIdIdx++
  }
  return encodedCalls
}

const processSingleAchievement = async (
  params: ProcessAchievementParams,
  procesedEventIDs: {
    achievementID: number
    eventID: number
  }[],
  calls: string[][],
) => {
  const {
    jobRunID,
    achievementID,
    groupedAchievements,
    config,
    teams,
    players,
    date,
    startEventIdx,
  } = params
  const { provider, ecRegistry, ecRegistryMap, batchWriter } = config
  groupedAchievements[achievementID] = groupedAchievements[achievementID].sort(
    (a, b) => a.event_id - b.event_id,
  )
  let encodedCalls = ''
  let hasHitLimit = false
  let endEventIdx = startEventIdx + 1

  // Loop through each achievement's events and try find the maximum number of events that can be processed
  // before hitting the gas limit
  while (!hasHitLimit && endEventIdx <= groupedAchievements[achievementID].length) {
    const { encodedCall, lastProcessedEventID, implementerAddress } = await getSetDataEncodedCall({
      provider,
      teams,
      players,
      groupedAchievements,
      achievementID,
      ecRegistry,
      ecRegistryMap,
      startEventIdx,
      endEventIdx,
    })

    // Mixed value achievements need to call the implementerAddress else call the ECRegistryAddress
    const addressToCall = implementerAddress || ecRegistry.address
    calls.push([addressToCall, encodedCall])
    procesedEventIDs.push({
      achievementID,
      eventID: lastProcessedEventID,
    })
    const { encodedCalls: updatedEncodedCalls, hasHitLimit: hasCallsHitLimit } =
      await updateEncodedCalls(
        jobRunID,
        achievementID,
        calls,
        batchWriter,
        lastProcessedEventID,
        date,
        procesedEventIDs,
      )
    hasHitLimit = hasCallsHitLimit
    endEventIdx++
    if (hasHitLimit) {
      Logger.info(
        `Hit gas limit when trying to process achievementID ${achievementID} and eventID ${lastProcessedEventID}`,
      )
    } else {
      encodedCalls = updatedEncodedCalls
      const hasAchievementBeenFullyProcessed =
        endEventIdx > groupedAchievements[achievementID].length
      if (!hasAchievementBeenFullyProcessed) {
        // If achievement has not been processed then we pop the last element from the calls array
        // to remove the function call for that achievement, add another event in the next iteration
        // and then try process it again.
        calls.pop()
      }
    }
  }
  return {
    encodedCalls,
    hasHitLimit,
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

const getLastProcessedInformation = async (
  sortedAchievementIDs: number[],
  groupedAchievements: AchievementsByIDs,
  batchWriter: ethers.Contract,
): Promise<LastProcessedInfo> => {
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
        throw new Error(`Cannot match player ID ${player_id} with response from ECRegistryMap`)
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
  const chainData = await ecRegistry.getData(achievementID, pageNumber, numPageRecords)
  const updatedTraitData = BitArray.fromUint8Array(chainData)

  for (let z = 0; z < updatedAchievements.length; z++) {
    if (updatedAchievements[z].value) {
      updatedTraitData.on(updatedAchievements[z].mappedID)
    } else {
      updatedTraitData.off(updatedAchievements[z].mappedID)
    }
  }

  const updatedTraitDataArr = updatedTraitData.toArray()
  const newDataIndexes: number[] = []
  const newDataValues: number[] = []

  for (let z = 0; z < updatedTraitDataArr.length; z++) {
    if (chainData[z] !== updatedTraitDataArr[z]) {
      newDataIndexes.push(z)
      newDataValues.push(updatedTraitDataArr[z])
    }
  }
  return ecRegistry.interface.encodeFunctionData('setData', [
    achievementID,
    newDataIndexes,
    newDataValues,
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
