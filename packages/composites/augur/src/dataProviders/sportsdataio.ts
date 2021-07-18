import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Execute } from '@chainlink/types'
import * as Sportsdataio from '@chainlink/sportsdataio-adapter'
import { BigNumber, ethers } from 'ethers'
import { CreateEvent } from '../methods/createMarkets'
import { ResolveEvent } from '../methods/resolveMarkets'

export const SPORTS_SUPPORTED = ['nfl', 'ncaa-fb']

interface NFLEvent {
  PointSpread: number | null
  Date: string | null
  Day: string
  GlobalGameID: number
  GlobalAwayTeamID: number
  GlobalHomeTeamID: number
  Status: string
}

interface CommonSchedule {
  Date: string
  GameID: number
  AwayTeamID: number
  HomeTeamID: number
  Status: string
  PointSpread: number | null
}

interface NFLScores {
  Date: string | null
  Day: string
  GlobalGameID: number
  GlobalAwayTeamID: number
  GlobalHomeTeamID: number
  Status: string
  AwayScore: number | null
  HomeScore: number | null
}

interface CFBGames {
  Day: string
  DateTime: string | null
  GlobalGameID: number
  GlobalAwayTeamID: number
  GlobalHomeTeamID: number
  Status: string
  AwayTeamScore: number | null
  HomeTeamScore: number | null
  PointSpread: number | null
}

interface CommonScores {
  Date: string
  GameID: number
  AwayTeamID: number
  HomeTeamID: number
  Status: string
  AwayScore: number | null
  HomeScore: number | null
}

const getSchedule = async (id: string, sport: string, season: string, exec: Execute): Promise<CommonSchedule[]> => {
  const input = {
    id,
    data: {
      sport,
      endpoint: 'schedule',
      season
    }
  }
  const response = await exec(input)
  const filtered = (response.result as { GlobalGameID: number }[])
    .filter(event => event.GlobalGameID != 0)

  switch (sport) {
    case 'nfl': {
      return (filtered as NFLEvent[]).map(event => ({
        Date: event.Date || event.Day,
        GameID: event.GlobalGameID,
        AwayTeamID: event.GlobalAwayTeamID,
        HomeTeamID: event.GlobalHomeTeamID,
        Status: event.Status,
        PointSpread: event.PointSpread,
      }))
    }
    case 'ncaa-fb': {
      return (filtered as CFBGames[]).map(event => ({
        Date: event.DateTime || event.Day,
        GameID: event.GlobalGameID,
        AwayTeamID: event.GlobalAwayTeamID,
        HomeTeamID: event.GlobalHomeTeamID,
        Status: event.Status,
        PointSpread: event.PointSpread
      }))
    }
    default:
      throw Error(`Unable to format schedule for sport "${sport}"`)
  }
}

const getScores = async (id: string, sport: string, season: string, exec: Execute): Promise<CommonScores[]> => {
  const input = {
    id,
    data: {
      sport,
      endpoint: 'scores',
      season
    }
  }
  const response = await exec(input)
  const filtered = (response.result as { GlobalGameID: number }[])
    .filter(event => event.GlobalGameID != 0)

  switch (sport) {
    case 'nfl': {
      return (filtered as NFLScores[]).map(event => ({
        Date: event.Date || event.Day,
        GameID: event.GlobalGameID,
        AwayTeamID: event.GlobalAwayTeamID,
        HomeTeamID: event.GlobalHomeTeamID,
        Status: event.Status,
        AwayScore: event.AwayScore,
        HomeScore: event.HomeScore,
      }))
    }
    case 'ncaa-fb': {
      return (filtered as CFBGames[]).map(event => ({
        Date: event.DateTime || event.Day,
        GameID: event.GlobalGameID,
        AwayTeamID: event.GlobalAwayTeamID,
        HomeTeamID: event.GlobalHomeTeamID,
        Status: event.Status,
        AwayScore: event.AwayTeamScore,
        HomeScore: event.HomeTeamScore,
      }))
    }
    default:
      throw Error(`Unable to format scores for sport "${sport}"`)
  }
}

const getSeason = () => `${new Date().getFullYear()}REG` // TODO: Sufficient? What if at the end of the year?

const createParams = {
  sport: true,
  daysInAdvance: true,
  startBuffer: true,
  contract: true,
}

export const create: Execute = async (input) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport.toLowerCase()
  if (!SPORTS_SUPPORTED.includes(sport)) {
    throw Error(`Unknown sport for Sportsdataio: ${sport}`)
  }

  const daysInAdvance = validator.validated.data.daysInAdvance
  const startBuffer = validator.validated.data.startBuffer
  const contract: ethers.Contract = validator.validated.data.contract

  const sportsdataioExec = Sportsdataio.makeExecute(Sportsdataio.makeConfig(Sportsdataio.NAME))

  const schedule = await getSchedule(input.id, sport, getSeason(), sportsdataioExec)

  Logger.debug(`Augur sportsdataio: Got ${schedule.length} events from data provider`)
  let skipNullDate = 0, skipStartBuffer = 0, skipDaysInAdvance = 0, cantCreate = 0

  // filter markets and build payloads for market creation
  const createEvents: CreateEvent[] = []
  for (const event of schedule) {
    if (!event.Date) {
      skipNullDate++
      continue
    }
    const startTime = Date.parse(event.Date)
    const diffTime = startTime - Date.now()
    if (diffTime / 1000 < startBuffer) {
      skipStartBuffer++
      continue
    }
    if (diffTime / (1000 * 3600 * 24) > daysInAdvance) {
      skipDaysInAdvance++
      continue
    }

    const [headToHeadMarket, spreadMarket, totalScoreMarket]: [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber]
      = await contract.getEventMarkets(event.GameID)
    const canCreate = headToHeadMarket.isZero() || (spreadMarket.isZero() && false) || (totalScoreMarket.isZero() && false)
    if (!canCreate) {
      cantCreate++
      continue
    }

    createEvents.push({
      id: BigNumber.from(event.GameID),
      homeTeamId: event.HomeTeamID,
      awayTeamId: event.AwayTeamID,
      startTime,
      homeSpread: 0, // TODO: Missing
      totalScore: 0, // TODO: Missing
      createSpread: false, // TODO: Missing
      createTotalScore: false // TODO: Missing
    })
  }

  Logger.debug(`Augur sportsdataio: Skipping ${skipNullDate} due to no event date`)
  Logger.debug(`Augur sportsdataio: Skipping ${skipStartBuffer} due to startBuffer`)
  Logger.debug(`Augur sportsdataio: Skipping ${skipDaysInAdvance} due to daysInAdvance`)
  Logger.debug(`Augur sportsdataio: Skipping ${cantCreate} due to no market to create`)

  return Requester.success(input.id, {
    data: { result: createEvents }
  })
}

const eventStatus: { [status: string]: number } = {
  'Scheduled': 1,
  'InProgress': 0, // TODO: Clarify???
  'Final': 2,
  'F/OT': 0, // TODO: Clarify???
  'Suspended': 0, // TODO: Clarify???
  'Postponed': 3,
  'Delayed': 0, // TODO: Clarify???
  'Canceled': 4
}

const resolveParams = {
  sport: true,
  eventId: true,
}

const findEventScore = async (jobRunID: string, sport: string, season: string, eventId: number, exec: Execute): Promise<CommonScores | undefined> => {
  const scores = await getScores(jobRunID, sport, season, exec)
  return scores.find((game) => game.GameID === eventId)
}

export const resolve: Execute = async (input) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const eventId = Number(validator.validated.data.eventId)
  const sport = validator.validated.data.sport
  const sportsdataioExec = Sportsdataio.makeExecute()

  const event = await findEventScore(input.id, sport, getSeason(), eventId, sportsdataioExec)
  if (!event) {
    throw Error(`Unable to find event ${eventId}`)
  }

  const status = eventStatus[event.Status]
  if (!status) {
    throw Error(`Unknown status: ${event.Status}`)
  }

  const resolveEvent: ResolveEvent = {
    id: BigNumber.from(event.GameID),
    status,
    homeScore: event.HomeScore || 0,
    awayScore: event.AwayScore || 0
  }

  return Requester.success(input.id, {
    data: { result: resolveEvent }
  })
}
