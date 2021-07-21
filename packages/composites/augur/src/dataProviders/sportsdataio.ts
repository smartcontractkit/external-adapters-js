import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterContext, Execute } from '@chainlink/types'
import * as Sportsdataio from '@chainlink/sportsdataio-adapter'
import { BigNumber, ethers } from 'ethers'
import { CreateEvent } from '../methods/createMarkets'
import { ResolveEvent } from '../methods/resolveMarkets'

interface NFLEvent {
  PointSpread: number
  Date: string | null
  GlobalGameID: number
  GlobalAwayTeamID: number
  GlobalHomeTeamID: number
  Status: string
}

type SportsdataioNFLSchedule = NFLEvent[]

const getNFLSchedule = async (
  id: string,
  season: string,
  sportsdataExec: Execute,
  context: AdapterContext,
): Promise<SportsdataioNFLSchedule> => {
  const input = {
    id,
    data: {
      sport: 'nfl',
      endpoint: 'schedule',
      season,
    },
  }
  const response = await sportsdataExec(input, context)
  return response.result
}

const getNFLScores = async (
  id: string,
  season: string,
  sportsdataExec: Execute,
  context: AdapterContext,
): Promise<NFLScores[]> => {
  const input = {
    id,
    data: {
      sport: 'nfl',
      endpoint: 'scores',
      season,
    },
  }
  const response = await sportsdataExec(input, context)
  return response.result
}

const getSeason = () => `${new Date().getFullYear()}REG` // TODO: Sufficient? What if at the end of the year?

const createParams = {
  sport: true,
  daysInAdvance: true,
  startBuffer: true,
  contract: true,
}

export const create: Execute = async (input, context) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport
  if (sport.toUpperCase() !== 'NFL') {
    throw Error(`Unknown sport for Sportsdataio: ${sport}`)
  }

  const daysInAdvance = validator.validated.data.daysInAdvance
  const startBuffer = validator.validated.data.startBuffer
  const contract: ethers.Contract = validator.validated.data.contract

  const sportsdataioExec = Sportsdataio.makeExecute(Sportsdataio.makeConfig(Sportsdataio.NAME))

  const schedule = await getNFLSchedule(input.id, getSeason(), sportsdataioExec, context)

  Logger.debug(`Augur sportsdataio: Got ${schedule.length} events from data provider`)
  let skipNullDate = 0,
    skipStartBuffer = 0,
    skipDaysInAdvance = 0,
    cantCreate = 0

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

    const [headToHeadMarket, spreadMarket, totalScoreMarket]: [
      ethers.BigNumber,
      ethers.BigNumber,
      ethers.BigNumber,
    ] = await contract.getEventMarkets(event.GlobalGameID)
    const canCreate =
      headToHeadMarket.isZero() ||
      (spreadMarket.isZero() && false) ||
      (totalScoreMarket.isZero() && false)
    if (!canCreate) {
      cantCreate++
      continue
    }

    createEvents.push({
      id: BigNumber.from(event.GlobalGameID),
      homeTeamId: event.GlobalHomeTeamID,
      awayTeamId: event.GlobalAwayTeamID,
      startTime,
      homeSpread: 0, // TODO: Missing
      totalScore: 0, // TODO: Missing
      createSpread: false, // TODO: Missing
      createTotalScore: false, // TODO: Missing
    })
  }

  Logger.debug(`Augur sportsdataio: Skipping ${skipNullDate} due to no event date`)
  Logger.debug(`Augur sportsdataio: Skipping ${skipStartBuffer} due to startBuffer`)
  Logger.debug(`Augur sportsdataio: Skipping ${skipDaysInAdvance} due to daysInAdvance`)
  Logger.debug(`Augur sportsdataio: Skipping ${cantCreate} due to no market to create`)

  return Requester.success(input.id, {
    data: { result: createEvents },
  })
}

interface NFLScores {
  Date: string
  GlobalGameID: number
  GlobalAwayTeamID: number
  GlobalHomeTeamID: number
  Status: string
  AwayScore: number | null
  HomeScore: number | null
}

const eventStatus: { [status: string]: number } = {
  Scheduled: 1,
  InProgress: 0, // TODO: Clarify???
  Final: 2,
  'F/OT': 0, // TODO: Clarify???
  Suspended: 0, // TODO: Clarify???
  Postponed: 3,
  Delayed: 0, // TODO: Clarify???
  Canceled: 4,
}

const resolveParams = {
  eventId: true,
}

export const resolve: Execute = async (input, context) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const eventId = Number(validator.validated.data.eventId)
  const sportsdataioExec = Sportsdataio.makeExecute()

  const scores = await getNFLScores(input.id, getSeason(), sportsdataioExec, context)
  const event = scores.find((game) => game.GlobalGameID === eventId)
  if (!event) {
    throw Error(`Unable to find event ${eventId}`)
  }

  const status = eventStatus[event.Status]
  if (!status) {
    throw Error(`Unknown status: ${event.Status}`)
  }

  const resolveEvent: ResolveEvent = {
    id: BigNumber.from(event.GlobalGameID),
    status,
    homeScore: event.HomeScore || 0,
    awayScore: event.AwayScore || 0,
  }

  return Requester.success(input.id, {
    data: { result: resolveEvent },
  })
}
