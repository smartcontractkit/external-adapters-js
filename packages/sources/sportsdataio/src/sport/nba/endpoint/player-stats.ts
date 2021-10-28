import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../../../config'
import { utils } from 'ethers'
import { DateTime } from 'luxon'

export const NAME = 'player-stats'

const customParams = {
  date: true,
  playerID: true,
}

export interface ResponseSchema {
  epochS: number
  StatID: number
  TeamID: number
  PlayerID: number
  SeasonType: number
  Season: number
  Name: string
  Team: string
  Position: string
  Started: number
  FanDuelSalary: number
  DraftKingSalary: number
  FantasyDuelSalary: number
  YahooSalary: number | null
  InjuryStatus: string | null
  InjuryBodyPart: string | null
  InjuryStartDate: string | null
  InjuryNotes: string | null
  FanDuelPosition: string
  DraftKingPosition: string
  YahooPosition: string | null
  OpponentRank: number
  OpponentPositionRank: number
  GlobalTeamID: number
  FantasyDraftSalary: number | null
  FantasyDraftPosition: string | null
  GameID: number
  OpponentID: number
  Opponent: string
  Day: string
  DateTime: string
  HomeOrAway: string
  isGameOver: true
  GlobalGameID: number
  GlobalOpponentID: number
  Updated: string
  Games: number
  FantasyPoints: number
  Minutes: number
  Seconds: number
  FieldGoalsMade: number
  FieldGoalsAttempted: number
  FieldGoalsPercentage: number
  EffectiveFieldGoalsPercentage: number
  TwoPointersMade: number
  TwoPointersAttempted: number
  TwoPointersPercentage: number
  ThreePointersMade: number
  ThreePointersAttempted: number
  ThreePointersPercentage: number
  FreeThrowsMade: number
  FreeThrowsAttempted: number
  FreeThrowPercentage: number
  OffensiveRebounds: number
  DefensiveRebounds: number
  Rebounds: number
  OffensiveReboundsPercentage: number
  DefensiveReboundsPercenage: number
  TotalReboundsPercentage: number
  Assists: number
  Steals: number
  BlockedShots: number
  Turnovers: number
  PersonalFouls: number
  Points: number
  TrueShootingAttempts: number
  TrueShootingPercentage: number
  PlayerEfficiencyRating: number
  AssistsPercentage: number
  StealsPercentage: number
  BlocksPercentage: number
  TurnOversPercentage: number
  UsageRatePercentage: number
  FantasyPointsFanDuel: number
  FantasyPointsDraftKings: number
  FantasyPointsYahoo: number
  PlusMinus: number
  DoubleDoubles: number
  TripleDoubles: number
  FantasyPointsFantasyDraft: number
  isClosed: boolean
  LineupConfirmed: boolean
  LineupStatus: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { date, playerID } = validator.validated.data
  const url = `/nba/stats/json/PlayerGameStatsByPlayer/${date}/${playerID}`

  const params = {
    key: config.nbaKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options)
  const d = DateTime.fromISO(response.data.DateTime, { zone: 'GMT' })
  const epochSeconds = d.valueOf() / 1000
  return Requester.success(
    jobRunID,
    Requester.withResult(response, packResponse(response.data, epochSeconds)),
    config.verbose,
  )
}

const packResponse = (response: ResponseSchema, epochS: number): string => {
  const dataTypes = [
    'uint16',
    'uint32',
    'bool',
    'bool',
    'uint32',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint8',
    'uint16',
  ]
  const dataValues = [
    response.Season,
    epochS,
    response.HomeOrAway === 'HOME',
    response.isGameOver,
    response.GlobalGameID,
    response.FieldGoalsMade,
    response.FieldGoalsAttempted,
    response.TwoPointersMade,
    response.TwoPointersAttempted,
    response.ThreePointersMade,
    response.ThreePointersAttempted,
    response.FreeThrowsMade,
    response.FreeThrowsAttempted,
    response.OffensiveRebounds,
    response.DefensiveRebounds,
    response.Rebounds,
    response.Assists,
    response.Steals,
    response.BlockedShots,
    response.DoubleDoubles,
    response.TripleDoubles,
    response.Points,
  ]
  const packedResult = utils.solidityPack(dataTypes, dataValues)
  return packedResult.startsWith('0x') ? packedResult.substring(2) : packedResult
}
