import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Execute } from '@chainlink/types'
import * as TheRundown from '@chainlink/therundown-adapter'
import { ethers } from 'ethers'
import { CreateTeamEvent } from '../methods/createMarkets'
import { ResolveTeam } from '../methods/resolveMarkets'
import { BigNumber } from 'ethers'

export const SPORTS_SUPPORTED = ['mlb', 'nba']

export const sportIdMapping: { [sport: string]: number } = {
  MLB: 3,
  NBA: 4,
}

const eventIdToNum = (eventId: string): BigNumber => BigNumber.from(`0x${eventId}`)

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
    event_status_detail: string
    score_home: number
    score_away: number
  }
  teams_normalized: {
    is_away: boolean
    is_home: boolean
    team_id: number
  }[]
}

const TBD_TEAM_ID = 2756

const createParams = {
  sport: true,
  daysInAdvance: true,
  startBuffer: true,
  contract: true,
  affiliateIds: true
}

const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() + days)
  return newDate
}

export const create: Execute = async (input) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport.toUpperCase()
  const sportId = sportIdMapping[sport]
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
  const theRundownExec = TheRundown.makeExecute(TheRundown.makeConfig(TheRundown.NAME))

  const events = []
  Logger.debug(`Augur theRundown: Fetching data from therundown for ${sport} (${params.data.sportId})`)
  for (let i = 0; i < daysInAdvance; i++) {
    params.data.date = addDays(params.data.date, 1)
    Logger.debug(`Augur theRundown: Fetching data for date ${params.data.date}`)
    const response = await theRundownExec(params)
    events.push(...response.result as TheRundownEvent[])
  }

  Logger.debug(`Augur theRundown: Got ${events.length} events from data provider`)
  let skipTBD = 0, skipStartBuffer = 0, skipNoTeams = 0, cantCreate = 0, skipTBDTeams = 0

  // filter markets and build payloads for market creation
  const eventsToCreate: CreateTeamEvent[] = []
  for (const event of events) {
    if (event.score.event_status_detail.toUpperCase() === 'TBD') {
      skipTBD++
      continue
    }

    const startTime = Date.parse(event.event_date)
    if ((startTime - Date.now()) / 1000 < startBuffer) {
      // markets would end too soon
      skipStartBuffer++
      continue
    }

    // skip if data is missing
    const affiliateId = getAffiliateId(event)
    const homeTeam = event.teams_normalized.find(team => team.is_home)
    const awayTeam = event.teams_normalized.find(team => team.is_away)
    if (!homeTeam || !awayTeam) {
      skipNoTeams++
      continue
    }

    // skip if a team hasn't been announced yet
    if (homeTeam.team_id === TBD_TEAM_ID || awayTeam.team_id === TBD_TEAM_ID) {
      skipTBDTeams++
      continue
    }

    const eventId = eventIdToNum(event.event_id)
    const [headToHeadMarket, spreadMarket, totalScoreMarket]: [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber] = await contract.getEventMarkets(eventId)

    // only create spread and totalScore markets if lines exist; always create headToHead market
    let homeSpread = transformSpecialNone(affiliateId && event.lines?.[affiliateId].spread.point_spread_home)
    let totalScore = transformSpecialNone(affiliateId && event.lines?.[affiliateId].total.total_over)
    const createSpread = homeSpread !== undefined
    const createTotalScore = totalScore !== undefined
    homeSpread = homeSpread || 0
    totalScore = totalScore || 0
    const canCreate = headToHeadMarket.isZero() || (spreadMarket.isZero() && createSpread) || (totalScoreMarket.isZero() && createTotalScore)
    if (!canCreate) {
      cantCreate++
      continue
    }

    eventsToCreate.push({
      id: eventId,
      homeTeamId: homeTeam.team_id,
      awayTeamId: awayTeam.team_id,
      startTime,
      homeSpread,
      totalScore,
      createSpread,
      createTotalScore
    })
  }

  Logger.debug(`Augur theRundown: Skipping ${skipTBD} due to TBD status`)
  Logger.debug(`Augur theRundown: Skipping ${skipStartBuffer} due to startBuffer`)
  Logger.debug(`Augur theRundown: Skipping ${skipNoTeams} due to no teams`)
  Logger.debug(`Augur theRundown: Skipping ${skipTBDTeams} due to TBD teams`)
  Logger.debug(`Augur theRundown: Skipping ${cantCreate} due to no market to create`)

  return Requester.success(input.id, {
    data: { result: eventsToCreate }
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
  sport: true,
  eventId: true
}

export const numToEventId = (num: BigNumber): string => num.toHexString().slice(2);

export const resolve: Execute = async (input) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const theRundownExec = TheRundown.makeExecute(TheRundown.makeConfig(TheRundown.NAME))

  const sport = validator.validated.data.sport
  const sportId = sportIdMapping[sport.toUpperCase()]
  const eventId = numToEventId(validator.validated.data.eventId)

  const req = {
    id: input.id,
    data: {
      sportId,
      eventId
    }
  }

  const response = (await theRundownExec(req)).result as TheRundownEvent

  const event: ResolveTeam = {
    id: eventIdToNum(response.event_id),
    status: eventStatus[response.score.event_status],
    homeScore: response.score.score_home,
    awayScore: response.score.score_away
  }

  return Requester.success(input.id, {
    data: { result: event }
  })
}
