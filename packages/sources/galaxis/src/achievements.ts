import { ethers } from 'ethers'
import { EC_REGISTRY_ABI, EC_REGISTRY_MAP_ABI, TRAIT_IMPLEMENTER_ABI } from './abis'
import { encodeAchievements } from './encoder'
import { ExtendedConfig } from './config'
import { Achievement, AchievementsByIDs, PlayerStruct, TeamStruct } from './types'

export const getEncodedCallsResult = async (
  playerAchievements: Achievement[],
  teamAchievements: Achievement[],
  config: ExtendedConfig,
): Promise<string> => {
  const groupedAchievements = getGroupedAchievementsByID(playerAchievements, teamAchievements)
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
      const encodedCall = await getSetDataEncodedCall(
        provider,
        teams,
        players,
        groupedAchievements,
        achievementID,
        ecRegistry,
      )
      calls.push([config.ecRegistryAddress, encodedCall])
      const updatedEncodedCalls = encodeAchievements(calls)
      if (updatedEncodedCalls.length <= config.maxEncodedCallsBytes) {
        encodedCalls = updatedEncodedCalls
      }
      hasHitLimit = updatedEncodedCalls.length > config.maxEncodedCallsBytes
    }
    currAchievementIdIdx++
  }
  return encodedCalls + `0${hasHitLimit ? 1 : 0}` // Strip out 0x
}

const getMappedIDs = (
  teams: TeamStruct[],
  players: PlayerStruct[],
  groupedAchievements: AchievementsByIDs,
  achievementID: string,
): number[] => {
  return groupedAchievements[achievementID].map(({ team_id, player_id }) => {
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
}

const getSetDataEncodedCall = async (
  provider: ethers.providers.JsonRpcProvider,
  teams: TeamStruct[],
  players: PlayerStruct[],
  groupedAchievements: AchievementsByIDs,
  achievementID: string,
  ecRegistry: ethers.Contract,
): Promise<string> => {
  const ids = getMappedIDs(teams, players, groupedAchievements, achievementID)
  if (isOnlyBooleanValues(groupedAchievements[achievementID].map(({ value }) => value))) {
    return getSetDataEncodedCallForOnlyBooleanAchievement(
      ecRegistry,
      ids,
      achievementID,
      groupedAchievements,
    )
  }
  return await getSetDataEncodedCallForMixedValueAchievement(
    provider,
    ecRegistry,
    ids,
    achievementID,
    groupedAchievements,
  )
}

const isOnlyBooleanValues = (values: (number | boolean)[]): boolean => {
  for (const value of values) {
    if (typeof value !== 'boolean') return false
  }
  return true
}

const getSetDataEncodedCallForOnlyBooleanAchievement = (
  ecRegistry: ethers.Contract,
  ids: number[],
  achievementID: string,
  groupedAchievements: AchievementsByIDs,
): string => {
  const values = groupedAchievements[achievementID].map(({ value }) => (!value ? 1 : 0))
  return ecRegistry.interface.encodeFunctionData('setData', [parseInt(achievementID), ids, values])
}

const getSetDataEncodedCallForMixedValueAchievement = async (
  provider: ethers.providers.JsonRpcProvider,
  ecRegistry: ethers.Contract,
  ids: number[],
  achievementID: string,
  groupedAchievements: AchievementsByIDs,
): Promise<string> => {
  const values = groupedAchievements[achievementID].map(({ value }) =>
    typeof value === 'boolean' ? (value ? 1 : 0) : value,
  )
  const { implementer: implementerAddress } = await ecRegistry.traits(achievementID)
  const implementer = new ethers.Contract(implementerAddress, TRAIT_IMPLEMENTER_ABI, provider)
  return implementer.interface.encodeFunctionData('setData', [ids, values])
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
