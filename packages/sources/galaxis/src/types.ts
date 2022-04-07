import { ethers } from 'ethers'
import { ExtendedConfig } from './config'

export interface FilteredAchievements {
  encodedCalls: string
  hasMore: boolean
}

export interface Achievement {
  team_id?: number
  player_id?: number
  event_id: number
  achievement_id: number
  value: boolean | number
}

export interface AchievementWithMappedID extends Achievement {
  mappedID: number
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

export interface AchievementsByIDs {
  [T: string]: Achievement[]
}

export interface GetSetDataEncodedCallParams {
  provider: ethers.providers.JsonRpcProvider
  teams: TeamStruct[]
  players: PlayerStruct[]
  groupedAchievements: AchievementsByIDs
  achievementID: number
  ecRegistry: ethers.Contract
  ecRegistryMap: ethers.Contract
  startEventIdx: number
  endEventIdx: number
}

export interface LastProcessedInfo {
  startEventIdx: number
  startAchievementIdx: number
  lastProcessedEventID: number
}

export interface ProcessAllAchievementParams {
  jobRunID: string
  date: string
  teams: TeamStruct[]
  players: PlayerStruct[]
  groupedAchievements: AchievementsByIDs
  sortedAchievementIDs: number[]
  lastProcessedInfo: LastProcessedInfo
}

export interface ProcessAchievementParams {
  jobRunID: string
  achievementID: number
  groupedAchievements: AchievementsByIDs
  config: ExtendedConfig
  teams: TeamStruct[]
  players: PlayerStruct[]
  date: string
  startEventIdx: number
}

export interface ProcessedEventInfo {
  achievementID: number
  eventID: number
}
