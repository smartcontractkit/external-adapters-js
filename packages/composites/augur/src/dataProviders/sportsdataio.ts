import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterContext, Execute } from '@chainlink/types'
import * as Sportsdataio from '@chainlink/sportsdataio-adapter'
import { BigNumber, ethers } from 'ethers'
import { CreateFighterEvent, CreateTeamEvent } from '../methods/createMarkets'
import { ResolveFight, ResolveTeam } from '../methods/resolveMarkets'
import { DateTime } from 'luxon'

export const SPORTS_SUPPORTED = ['nfl', 'ncaa-fb', 'mma']

const getEpochTime = (dateTime: string, zone = 'America/New_York'): number => {
  return DateTime.fromISO(dateTime, { zone }).toMillis()
}

interface NFLTeam {
  GlobalTeamID: number
  FullName: string
}

interface NFLEvent {
  PointSpread: number | null
  Date: string | null
  Day: string
  GlobalGameID: number
  AwayTeam: string
  GlobalAwayTeamID: number
  HomeTeam: string
  GlobalHomeTeamID: number
  Status: string
  AwayTeamMoneyLine: number | null
  HomeTeamMoneyLine: number | null
  OverUnder: number | null
}

interface TeamSchedule {
  Date: string
  GameID: number
  AwayTeamName: string
  AwayTeamID: number
  HomeTeamName: string
  HomeTeamID: number
  Status: string
  PointSpread: number | null
  AwayTeamMoneyLine: number | null
  HomeTeamMoneyLine: number | null
  OverUnder: number | null
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
  AwayTeamMoneyLine: number | null
  HomeTeamMoneyLine: number | null
  OverUnder: number | null
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

const getCurrentSeason = async (
  id: string,
  sport: string,
  exec: Execute,
  context: AdapterContext,
): Promise<string> => {
  if (!['nfl', 'ncaa-fb'].includes(sport)) return 'NO_INFO'

  const input = {
    id,
    data: {
      sport,
      endpoint: 'current-season',
    },
  }

  const response = await exec(input, context)
  return response.data.result
}

const getTeams = async (
  id: string,
  sport: string,
  exec: Execute,
  context: AdapterContext,
): Promise<NFLTeam[]> => {
  if (sport !== 'nfl') return []

  const input = {
    id,
    data: {
      sport,
      endpoint: 'teams',
    },
  }
  const response = await exec(input, context)
  return response.data.result
}

const getSchedule = async (
  id: string,
  sport: string,
  exec: Execute,
  context: AdapterContext,
): Promise<TeamSchedule[]> => {
  const currentSeason = await getCurrentSeason(id, sport, exec, context)
  switch (sport) {
    case 'nfl': {
      let events: NFLEvent[] = []

      for (const seasonPostfixKey of ['PRE', '', 'POST', 'STAR']) {
        const input = {
          id,
          data: {
            sport,
            endpoint: 'schedule',
            season: `${currentSeason}${seasonPostfixKey}`,
          },
        }
        const response = await exec(input, context)
        const filtered = (response.result as NFLEvent[]).filter((event) => event.GlobalGameID != 0)

        events = [...events, ...filtered]
      }

      // Need full team names. API just returns an abbreviations
      const teamNames = await getTeams(id, sport, exec, context)
      events = events.map((event) => {
        const homeTeam = teamNames.find(
          ({ GlobalTeamID }) => GlobalTeamID === event.GlobalHomeTeamID,
        )
        const awayTeam = teamNames.find(
          ({ GlobalTeamID }) => GlobalTeamID === event.GlobalAwayTeamID,
        )

        if (!homeTeam || !awayTeam) return event

        return {
          ...event,
          AwayTeam: awayTeam.FullName,
          HomeTeam: homeTeam.FullName,
        }
      })

      return (events as NFLEvent[]).map((event) => ({
        Date: event.Date || event.Day,
        GameID: event.GlobalGameID,
        AwayTeamName: event.AwayTeam,
        AwayTeamID: event.GlobalAwayTeamID,
        HomeTeamName: event.HomeTeam,
        HomeTeamID: event.GlobalHomeTeamID,
        Status: event.Status,
        PointSpread: event.PointSpread,
        AwayTeamMoneyLine: event.AwayTeamMoneyLine,
        HomeTeamMoneyLine: event.HomeTeamMoneyLine,
        OverUnder: event.OverUnder,
      }))
    }
    case 'ncaa-fb': {
      const input = {
        id,
        data: {
          sport,
          endpoint: 'schedule',
          season: currentSeason,
        },
      }

      const response = await exec(input, context)
      const filtered = (response.result as { GlobalGameID: number }[]).filter(
        (event) => event.GlobalGameID != 0,
      )

      return (filtered as CFBGames[]).map((event) => ({
        Date: event.DateTime || event.Day,
        GameID: event.GlobalGameID,
        AwayTeamName: 'Away',
        AwayTeamID: event.GlobalAwayTeamID,
        HomeTeamName: 'Home',
        HomeTeamID: event.GlobalHomeTeamID,
        Status: event.Status,
        PointSpread: event.PointSpread,
        AwayTeamMoneyLine: event.AwayTeamMoneyLine,
        HomeTeamMoneyLine: event.HomeTeamMoneyLine,
        OverUnder: event.OverUnder,
      }))
    }
    default:
      throw Error(`Unable to format schedule for sport "${sport}"`)
  }
}

const getScores = async (
  id: string,
  sport: string,
  exec: Execute,
  context: AdapterContext,
): Promise<CommonScores[]> => {
  const currentSeason = await getCurrentSeason(id, sport, exec, context)
  switch (sport) {
    case 'nfl': {
      let events: NFLScores[] = []

      for (const seasonPostfixKey of ['PRE', '', 'POST', 'STAR']) {
        const input = {
          id,
          data: {
            sport,
            endpoint: 'scores',
            season: `${currentSeason}${seasonPostfixKey}`,
          },
        }
        const response = await exec(input, context)
        const filtered = (response.result as NFLScores[]).filter((event) => event.GlobalGameID != 0)

        events = [...events, ...filtered]
      }
      return events.map((event) => ({
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
      const input = {
        id,
        data: {
          sport,
          endpoint: 'scores',
          season: currentSeason,
        },
      }

      const response = await exec(input, context)
      const filtered = (response.result as { GlobalGameID: number }[]).filter(
        (event) => event.GlobalGameID != 0,
      )

      return (filtered as CFBGames[]).map((event) => ({
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

const createParams = {
  sport: true,
  daysInAdvance: true,
  startBuffer: false,
  contract: true,
}

export const createTeam: Execute = async (input, context) => {
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

  const schedule = (await getSchedule(input.id, sport, sportsdataioExec, context)).filter(
    (event) => event.Status === 'Scheduled',
  )

  Logger.debug(`Augur sportsdataio: Got ${schedule.length} events from data provider`)
  let skipNullDate = 0,
    skipStartBuffer = 0,
    skipDaysInAdvance = 0,
    cantCreate = 0

  // filter markets and build payloads for market creation
  const createEvents: CreateTeamEvent[] = []
  for (const event of schedule) {
    if (!event.Date) {
      skipNullDate++
      continue
    }
    const startTime = getEpochTime(event.Date)
    const diffTime = startTime - Date.now()
    if (diffTime / 1000 < startBuffer) {
      skipStartBuffer++
      continue
    }
    if (diffTime / (1000 * 3600 * 24) > daysInAdvance) {
      skipDaysInAdvance++
      continue
    }

    const [headToHeadMarket, spreadMarket, totalScoreMarket]: [BigNumber, BigNumber, BigNumber] =
      await contract.getEventMarkets(event.GameID)
    const canCreate =
      headToHeadMarket.isZero() ||
      (spreadMarket.isZero() && false) ||
      (totalScoreMarket.isZero() && false)
    if (!canCreate) {
      cantCreate++
      continue
    }

    createEvents.push({
      id: BigNumber.from(event.GameID),
      homeTeamName: event.HomeTeamName,
      homeTeamId: event.HomeTeamID,
      awayTeamName: event.AwayTeamName,
      awayTeamId: event.AwayTeamID,
      startTime,
      homeSpread: event.PointSpread || 0,
      totalScore: event.OverUnder || 0,
      createSpread: event.PointSpread !== null,
      createTotalScore: event.OverUnder !== null,
      moneylines: [event.HomeTeamMoneyLine || 0, event.AwayTeamMoneyLine || 0],
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

interface FightSchedule {
  Active: boolean
  DateTime: string
  EventId: number
  Status: string
}

interface FightEvent {
  Active: boolean
  DateTime: string
  Fights: Fight[]
  Status: string
}

interface Fight {
  Active: boolean
  DateTime?: string
  FightId: number
  Fighters: Fighter[]
  ResultClock: number
  ResultRound: number
  Status: string
}

interface Fighter {
  Active: boolean
  FighterId: number
  FirstName: string
  LastName: string
  Moneyline: number
  Winner: boolean
}

const getFightSchedule = async (
  id: string,
  sport: string,
  league: string,
  season: string,
  exec: Execute,
  context: AdapterContext,
): Promise<FightSchedule[]> => {
  const input = {
    id,
    data: {
      sport,
      league,
      season,
      endpoint: 'schedule',
    },
  }
  const response = await exec(input, context)
  return (response.result as FightSchedule[]).filter((event) => event.Active)
}

const getFights = async (
  id: string,
  sport: string,
  eventId: number,
  exec: Execute,
  context: AdapterContext,
): Promise<Fight[]> => {
  const input = {
    id,
    data: {
      sport,
      eventId,
      endpoint: 'event',
    },
  }
  const response = await exec(input, context)
  const fights = (response.result as FightEvent).Fights
  return fights.filter((fight) => fight.Active)
}

export const createFighter: Execute = async (input, context) => {
  const validator = new Validator(input, createParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport.toLowerCase()
  if (!SPORTS_SUPPORTED.includes(sport)) {
    throw Error(`Unknown sport for Sportsdataio: ${sport}`)
  }

  const daysInAdvance = validator.validated.data.daysInAdvance
  const contract: ethers.Contract = validator.validated.data.contract

  const sportsdataioExec = Sportsdataio.makeExecute(Sportsdataio.makeConfig(Sportsdataio.NAME))

  const fights: Fight[] = []

  const leagues = ['UFC']
  for (const league of leagues) {
    const season = new Date().getFullYear()
    Logger.debug(`Getting fight schedule for league ${league} in season ${season}.`)
    const schedule = (
      await getFightSchedule(input.id, sport, league, `${season}`, sportsdataioExec, context)
    ).filter((event) => event.Status === 'Scheduled')

    Logger.debug(`Getting ${schedule.length} events from season, then filtering out unscheduled`)
    for (const event of schedule) {
      const eventFights = (
        await getFights(input.id, sport, event.EventId, sportsdataioExec, context)
      )
        .filter((fight) => fight.Status === 'Scheduled')
        .map((fight) => ({ ...fight, DateTime: event.DateTime }))
      fights.push(...eventFights)
    }
  }

  Logger.debug(`Augur sportsdataio: Got ${fights.length} fights from data provider`)
  let skipNullDate = 0,
    skipDaysInAdvance = 0,
    skipOddNumberFighters = 0,
    cantCreate = 0

  // filter markets and build payloads for market creation
  const createEvents: CreateFighterEvent[] = []
  for (const fight of fights) {
    if (!fight.DateTime) {
      skipNullDate++
      continue
    }
    const startTime = getEpochTime(fight.DateTime)
    const diffTime = startTime - Date.now()
    if (diffTime / (1000 * 3600 * 24) > daysInAdvance) {
      skipDaysInAdvance++
      continue
    }

    const event = await contract.getEvent(fight.FightId)
    if (event.eventStatus !== 0) {
      cantCreate++
      continue
    }

    const fighters = fight.Fighters.filter((fighter) => fighter.Active)
    if (fighters.length !== 2) {
      skipOddNumberFighters++
      continue
    }

    const moneylines = fighters.map((fighter) => fighter.Moneyline)

    createEvents.push({
      id: BigNumber.from(fight.FightId),
      fighterA: fighters[0].FighterId,
      fighterAname: `${fighters[0].FirstName} ${fighters[0].LastName}`,
      fighterB: fighters[1].FighterId,
      fighterBname: `${fighters[1].FirstName} ${fighters[1].LastName}`,
      startTime,
      moneylines,
    })
  }

  Logger.debug(`Augur sportsdataio: Skipping ${skipNullDate} due to no event date`)
  Logger.debug(`Augur sportsdataio: Skipping ${skipDaysInAdvance} due to daysInAdvance`)
  Logger.debug(
    `Augur sportsdataio: Skipping ${skipOddNumberFighters} due to odd number of fighters`,
  )
  Logger.debug(`Augur sportsdataio: Skipping ${cantCreate} due to no market to create`)

  return Requester.success(input.id, {
    data: { result: createEvents },
  })
}

const eventStatus: { [status: string]: number } = {
  Scheduled: 1,
  InProgress: 0, // TODO: Clarify???
  Final: 2,
  'F/OT': 0, // TODO: Clarify???
  Suspended: 4, // Treat as canceled
  Postponed: 3,
  Delayed: 0, // TODO: Clarify???
  Canceled: 4,
}

const resolveParams = {
  sport: true,
  eventId: true,
}

const findEventScore = async (
  jobRunID: string,
  sport: string,
  eventId: number,
  exec: Execute,
  context: AdapterContext,
): Promise<CommonScores | undefined> => {
  const scores = await getScores(jobRunID, sport, exec, context)
  return scores.find((game) => game.GameID === eventId)
}

export const resolveTeam: Execute = async (input, context) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const eventId = Number(validator.validated.data.eventId)
  const sport = validator.validated.data.sport
  const sportsdataioExec = Sportsdataio.makeExecute(Sportsdataio.makeConfig(Sportsdataio.NAME))

  const event = await findEventScore(input.id, sport, eventId, sportsdataioExec, context)
  if (!event) {
    throw Error(`Unable to find event ${eventId}`)
  }

  const status = eventStatus[event.Status]
  if (!status) {
    throw Error(`Unknown status: ${event.Status}`)
  }

  const resolveEvent: ResolveTeam = {
    id: BigNumber.from(event.GameID),
    status,
    homeScore: event.HomeScore || 0,
    awayScore: event.AwayScore || 0,
  }

  return Requester.success(input.id, {
    data: { result: resolveEvent },
  })
}

const getFight = async (
  id: string,
  sport: string,
  fightId: number,
  exec: Execute,
  context: AdapterContext,
): Promise<Fight> => {
  const input = {
    id,
    data: {
      sport,
      fightId,
      endpoint: 'fight',
    },
  }
  const response = await exec(input, context)
  return response.result
}

export const resolveFight: Execute = async (input, context) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const fightId = Number(validator.validated.data.eventId)
  const sport = validator.validated.data.sport
  const sportsdataioExec = Sportsdataio.makeExecute(Sportsdataio.makeConfig(Sportsdataio.NAME))

  Logger.debug(`Getting fight ${input.id} for sport ${sport}, which has fightId ${fightId}`)
  const fight = await getFight(input.id, sport, fightId, sportsdataioExec, context)

  if (!fight) {
    throw Error(`Unable to find fight ${fightId}`)
  }

  const status = eventStatus[fight.Status]
  if (!status) {
    throw Error(`Unknown status: ${fight.Status}`)
  }

  const winners = fight.Fighters.filter((fighter) => fighter.Active && fighter.Winner)

  const draw = winners.length !== 1
  let winnerId = 0
  let fighters = fight.Fighters
  if (!draw) {
    // The fighters array for an event can contain previous, now non-active fighters,
    // as well as the current active fighters. During the creation code, the non-active
    // fighters are filtered but kept in the same order as the data source provides.
    //
    // In the case where an event is marked Canceled, both the fighters go to `Active = false`
    // so we need to to only do this filter here if the fight is indeed a draw, or else the
    // identificaton of fighterA and fighterB below would break.
    //
    // In the case where this is a draw, AND there was a change of fighers, setting the default
    // fighers list to the raw array, and indexing to 0 and 1 could indeed cause this call to
    // provide the incorrect fighter ID for fighterA, but in both of these cases the market resolves
    // as `No Contest` so it still ends up giving proper resolution.
    fighters = fighters.filter((fighter) => fighter.Active)

    // If this is a draw the winnerId is kept as 0 (uninitialized)
    winnerId = winners[0].FighterId
  }

  const resolveEvent: ResolveFight = {
    id: BigNumber.from(fight.FightId),
    status,
    fighterA: fighters[0].FighterId,
    fighterB: fighters[1].FighterId,
    winnerId,
    draw,
  }

  return Requester.success(input.id, {
    data: { result: resolveEvent },
  })
}
