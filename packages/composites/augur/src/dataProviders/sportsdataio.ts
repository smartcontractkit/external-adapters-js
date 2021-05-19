import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Execute } from '@chainlink/types'
import * as Sportsdataio from '@chainlink/sportsdataio-adapter'
import { BigNumber } from 'ethers'
import { packCreation } from '../methods/createMarkets'
import { packResolution } from '../methods/resolveMarkets'

interface NFLEvent {
  PointSpread: number
  Date: string
  GlobalGameID: number
  GlobalAwayTeamID: number
  GlobalHomeTeamID: number
  Status: string
}

type SportsdataioNFLSchedule = NFLEvent[]

const getNFLSchedule = async (id: string, season: string, sportsdataExec: Execute): Promise<SportsdataioNFLSchedule> => {
  const input = {
    id,
    data: {
      sport: 'nfl',
      endpoint: 'schedule',
      season
    }
  }
  const response = await sportsdataExec(input)
  return response.result
}

const getNFLScores = async (id: string, season: string, sportsdataExec: Execute): Promise<NFLScores[]> => {
  const input = {
    id,
    data: {
      sport: 'nfl',
      endpoint: 'scores',
      season
    }
  }
  const response = await sportsdataExec(input)
  return response.result
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

  const sport = validator.validated.data.sport
  if (sport.toUpperCase() !== 'NFL') {
    throw Error(`Unknown sport for Sportsdataio: ${sport}`)
  }

  const daysInAdvance = validator.validated.data.daysInAdvance
  const startBuffer = validator.validated.data.startBuffer
  // TODO: Doesn't do anything yet
  // const contract: ethers.Contract = validator.validated.data.contract

  const sportsdataioExec = Sportsdataio.makeExecute()

  const schedule = await getNFLSchedule(input.id, getSeason(), sportsdataioExec)

  // filter markets and build payloads for market creation
  const packed = [];
  for (const event of schedule) {
    const startTime = Date.parse(event.Date)
    const diffTime = startTime - Date.now()
    if (diffTime / 1000 < startBuffer) continue
    if (diffTime / (1000 * 3600 * 24) > daysInAdvance) continue

    // TODO: Doesn't do anything right now
    /*const [headToHeadMarket, spreadMarket, totalScoreMarket]: [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber]
      = await contract.getEventMarkets(event.GlobalGameID)*/

    const start = Date.parse(event.Date) / 1000
    // TODO: Missing homeSpread
    // TODO: Missing totalScore
    packed.push(packCreation(BigNumber.from(event.GlobalGameID), event.GlobalHomeTeamID, event.GlobalHomeTeamID, start, 0, 0, false, false))
  }

  return Requester.success(input.id, {
    data: { result: packed }
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
  sport: true
}

export const resolve: Execute = async (input) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport
  if (sport.toUpperCase() !== 'NFL') {
    throw Error(`Unknown sport for Sportsdataio: ${sport}`)
  }

  const sportsdataioExec = Sportsdataio.makeExecute()

  const schedule = await getNFLScores(input.id, getSeason(), sportsdataioExec)

  const statusCompleted = [
    'Canceled',
    'Final',
    'Postponed',
    // TODO: 'Suspended' ???
  ]

  const filtered = schedule.filter(event => statusCompleted.includes(event.Status))

  const packed = filtered.map((event) => {
    const status = eventStatus[event.Status]
    if (!status) return undefined

    // TODO: Check what to do if score is null
    return packResolution(BigNumber.from(event.GlobalGameID), status, event.HomeScore || 0, event.AwayScore || 0)
  }).filter((event) => !!event)

  return Requester.success(input.id, {
    data: { result: packed }
  })
}
