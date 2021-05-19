import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Execute } from '@chainlink/types'
import * as TheRundown from '@chainlink/therundown-adapter'
import { eventIdToNum, sportIdMapping } from '../methods'
import { ethers } from 'ethers'
import { packCreation } from '../methods/createMarkets'
import { packResolution } from '../methods/resolveMarkets'

interface TheRundownEvent {
  event_id: string
  event_date: string
  lines?: {
    [key: string]: {
      affiliate: {
        affiliate_id: number
      }
      spread: {
        point_spread_home: number
      }
      total: {
        total_over: number
      }
    }
  }
  score: {
    event_status: string
    score_home: number
    score_away: number
  }
  teams_normalized: {
    is_away: boolean
    is_home: boolean
    team_id: number
  }[]
}

const createParams = {
  sport: true,
  daysInAdvance: true,
  startBuffer: true,
  contract: true,
  affiliateIds: true
}

const addDays = (date: Date, days: number): Date => {
  date.setDate(date.getDate() + days)
  return date
}

export const create: Execute = async (input) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sportId = sportIdMapping[validator.validated.data.sport]
  const daysInAdvance = validator.validated.data.daysInAdvance
  const startBuffer = validator.validated.data.startBuffer
  const contract = validator.validated.data.contract
  const affiliateIds: number[] = validator.validated.data.affiliateIds
  const getAffiliateId = (event: TheRundownEvent) => affiliateIds.find((id) => !!event.lines && id in event.lines)

  const params = { id: input.id, data: {
      sportId,
      status: 'STATUS_SCHEDULED',
      date: new Date(),
      endpoint: 'events'
    }}
  const theRundownExec = TheRundown.makeExecute()

  const events = []
  for (let i = 0; i < daysInAdvance; i++) {
    params.data.date = addDays(params.data.date, 1)

    const response = await theRundownExec(params)
    events.push(...response.result as TheRundownEvent[])
  }

  // filter markets and build payloads for market creation
  const packed = [];
  for (const event of events) {
    const startTime = Date.parse(event.event_date)
    if ((startTime - Date.now()) / 1000 < startBuffer) continue // markets would end too soon

    // skip if data is missing
    const affiliateId = getAffiliateId(event)
    const homeTeam = event.teams_normalized.find(team => team.is_home)
    const awayTeam = event.teams_normalized.find(team => team.is_away)
    if (!affiliateId || !homeTeam || !awayTeam) continue

    const eventId = eventIdToNum(event.event_id)
    const [headToHeadMarket, spreadMarket, totalScoreMarket]: [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber] = await contract.getEventMarkets(eventId)

    // only create spread and totalScore markets if lines exist; always create headToHead market
    let homeSpread = transformSpecialNone(event.lines?.[affiliateId].spread.point_spread_home)
    let totalScore = transformSpecialNone(event.lines?.[affiliateId].total.total_over)
    const createSpread = homeSpread !== undefined
    const createTotalScore = totalScore !== undefined
    homeSpread = homeSpread || 0
    totalScore = totalScore || 0
    const canCreate = headToHeadMarket.isZero() || (spreadMarket.isZero() && createSpread) || (totalScoreMarket.isZero() && createTotalScore)
    if (!canCreate) continue

    packed.push(packCreation(eventId, homeTeam.team_id, awayTeam.team_id, startTime, homeSpread, totalScore, createSpread, createTotalScore))
  }

  return Requester.success(input.id, {
    data: { result: packed }
  })
}

/**
 * TheRundown API returns `0.0001` as a special case which should
 * be treated as the value is `undefined`. This function transforms
 * `0.0001` to `undefined`, and leaves `val` unchanged otherwise.
 * @param {number} val - The value returned from the API
 * @return {number|undefined} Transformed `val`
 */
const transformSpecialNone = (val?: number) => val === 0.0001 ? undefined : val

const eventStatus: { [key: string]: number } = {
  'STATUS_SCHEDULED': 1,
  'STATUS_FINAL': 2,
  'STATUS_POSTPONED': 3,
  'STATUS_CANCELED': 4
}

const resolveParams = {
  sportId: true
}

const subDays = (date: Date, days: number): Date => {
  date.setDate(date.getDate() - days)
  return date
}

export const resolve: Execute = async (input) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const sportId = validator.validated.data.sportId

  const params = { id: input.id, data: {
      sportId,
      date: new Date(),
      endpoint: 'events'
    }}
  const theRundownExec = TheRundown.makeExecute()

  const events = []
  for (let i = 0; i < 2; i++) {
    params.data.date = subDays(params.data.date, i)

    const response = await theRundownExec(params)
    events.push(...response.result as TheRundownEvent[])
  }

  const statusCompleted = [
    'STATUS_CANCELED',
    'STATUS_FINAL',
    'STATUS_POSTPONED'
  ]

  const filtered = events.filter(({ score: { event_status }}) => statusCompleted.includes(event_status))

  const packed = filtered.map((event) => {
    const status = eventStatus[event.score.event_status]
    if (!status) return undefined

    return packResolution(eventIdToNum(event.event_id), status, event.score.score_home, event.score.score_away)
  }).filter((event) => !!event)

  return Requester.success(input.id, {
    data: { result: packed }
  })
}

