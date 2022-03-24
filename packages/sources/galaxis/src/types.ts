import { ethers } from 'ethers'

export interface FilteredAchievements {
  encodedCalls: string
  hasMore: boolean
}

export interface Achievement {
  team_id?: number
  player_id?: number
  achievement_id: number
  value: boolean | number
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
