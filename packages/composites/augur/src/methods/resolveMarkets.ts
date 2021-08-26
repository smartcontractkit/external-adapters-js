import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute, AdapterContext } from '@chainlink/types'
import { Config } from '../config'
import { TEAM_SPORTS, FIGHTER_SPORTS, getContract, isMMA, isContractIdentifier } from './index'
import { ethers } from 'ethers'
import { theRundown, sportsdataio } from '../dataProviders'

const resolveParams = {
  contractAddress: true,
  sport: true,
}

export interface ResolveTeam {
  id: ethers.BigNumber
  status: number
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
}

export interface ResolveFight {
  id: ethers.BigNumber
  status: number
  fighterA: number
  fighterB: number
  winnerId?: number
  draw: boolean
  weird: boolean
}

enum FightStatus {
  Final = 2,
  Postponed = 3,
  Cancelled = 4,
}

const statusCompleted = [FightStatus.Cancelled, FightStatus.Final, FightStatus.Postponed]

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport.toLowerCase()
  const contractAddress = validator.validated.data.contractAddress

  if (TEAM_SPORTS.includes(sport)) {
    return await resolveTeam(input.id, sport, contractAddress, context, config)
  } else if (FIGHTER_SPORTS.includes(sport)) {
    return await resolveFights(input.id, sport, contractAddress, context, config)
  } else {
    throw Error(`Unable to identify sport "${sport}"`)
  }
}

const resolveTeam = async (
  jobRunID: string,
  sport: string,
  contractAddress: string,
  context: AdapterContext,
  config: Config,
) => {
  if (!isContractIdentifier(sport)) throw Error(`Unsupported sport ${sport}`)
  const contract = getContract(sport, contractAddress, config.signer)

  let getEvent: Execute
  if (theRundown.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = theRundown.resolve
  } else if (sportsdataio.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = sportsdataio.resolveTeam
  } else {
    throw Error(`Unknown data provider for sport ${sport}`)
  }

  const eventIDs: ethers.BigNumber[] = await contract.listResolvableEvents()
  const events: ResolveTeam[] = []
  for (const eventId of eventIDs) {
    try {
      const response = await getEvent(
        {
          id: jobRunID,
          data: {
            sport,
            eventId,
          },
        },
        context,
      )
      events.push(response.result as ResolveTeam)
    } catch (e) {
      Logger.error(e)
    }
  }

  Logger.debug(`Augur: Found ${events.length} events to attempt to resolve`)

  // Filters out events that aren't yet ready to resolve.
  const eventReadyToResolve = events.filter(({ id, status }) => {
    Logger.debug(`Augur: status info`, {
      id: id.toHexString().slice(2),
      status,
      needs_resolve: statusCompleted.includes(status),
    })
    return statusCompleted.includes(status)
  })

  Logger.debug(`Augur: Prepared to resolve ${eventReadyToResolve.length} events`)

  let failed = 0
  let succeeded = 0

  let nonce = await config.signer.getTransactionCount()
  for (let i = 0; i < eventReadyToResolve.length; i++) {
    Logger.info(`Augur: resolving event "${eventReadyToResolve[i].id}"`)

    try {
      const tx = await contract.resolveEvent(
        eventReadyToResolve[i].id,
        eventReadyToResolve[i].status,
        eventReadyToResolve[i].homeTeamId,
        eventReadyToResolve[i].awayTeamId,
        eventReadyToResolve[i].homeScore * 10,
        eventReadyToResolve[i].awayScore * 10,
        { nonce },
      )
      Logger.info(`Augur: Created tx: ${tx.hash}`)
      nonce++
      succeeded++
    } catch (e) {
      failed++
      Logger.error(e)
    }
  }

  Logger.debug(`Augur: ${succeeded} resolved markets`)
  Logger.debug(`Augur: ${failed} markets failed to resolve`)

  return Requester.success(jobRunID, {})
}

const fightStatusMapping: { [key: string]: number } = {
  unknown: 0,
  home: 1,
  away: 2,
  draw: 3,
}

const resolveFights = async (
  jobRunID: string,
  sport: string,
  contractAddress: string,
  context: AdapterContext,
  config: Config,
) => {
  if (!isContractIdentifier(sport)) throw Error(`Unsupported sport ${sport}`)
  const contract = getContract(sport, contractAddress, config.signer)
  if (!isMMA(contract, sport)) throw Error(`Unsupported fight sport ${sport}`)

  let getEvent: Execute
  if (theRundown.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = theRundown.resolve
  } else if (sportsdataio.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = sportsdataio.resolveFight
  } else {
    throw Error(`Unknown data provider for sport ${sport}`)
  }

  Logger.debug('Augur: Getting list of potentially resolvable events')
  const eventIDs: ethers.BigNumber[] = await contract.listResolvableEvents()
  Logger.debug(`Augur: Found ${eventIDs.length} potentially resolvable events`)
  const events: ResolveFight[] = []
  for (const eventId of eventIDs) {
    try {
      const response = await getEvent(
        {
          id: jobRunID,
          data: {
            sport,
            eventId,
          },
        },
        context,
      )
      events.push(response.result as ResolveFight)
    } catch (e) {
      Logger.error(e)
    }
  }

  // If the event from sportsdataio doesn't match the format we expect, check it against contract.
  // Note that this code is destructive to the events array's contents.
  for (const event of events.filter((event) => event.weird)) {
    Logger.debug(`Augur: Checking weird event ${event.id} against market`, event)
    const { homeTeamId, awayTeamId } = await contract.getSportsEvent(event.id)
    // The active fighters changed so we classify this fight as Cancelled, which resolves as No Contest.
    if (!homeTeamId.eq(event.fighterA) || !awayTeamId.eq(event.fighterB)) {
      event.status = FightStatus.Cancelled
      Logger.debug('Augur: forcing event status to Cancelled', event)
    }
  }

  // Filters out events that aren't yet ready to resolve.
  const eventReadyToResolve = events.filter(({ status }) => statusCompleted.includes(status))
  Logger.debug(`Augur: Ready to resolve ${eventReadyToResolve.length} markets.`)

  let failed = 0
  let succeeded = 0

  let nonce = await config.signer.getTransactionCount()
  for (const fight of eventReadyToResolve) {
    Logger.info(`Augur: resolving event "${fight.id.toString()}"`)

    let fightStatus = 0
    if (fight.draw) {
      fightStatus = fightStatusMapping.draw
    } else if (fight.winnerId === fight.fighterA) {
      fightStatus = fightStatusMapping.home
    } else if (fight.winnerId === fight.fighterB) {
      fightStatus = fightStatusMapping.away
    }

    // This call resolves markets.
    try {
      Logger.debug(
        `Augur: Resolving market with these arguments: ${JSON.stringify(fight)}, ${fightStatus}`,
      )
      const tx = await contract.resolveEvent(
        fight.id,
        fight.status,
        fight.fighterA,
        fight.fighterB,
        fightStatus,
        { nonce },
      )
      Logger.info(`Augur: Created tx: ${tx.hash}`)
      nonce++
      succeeded++
    } catch (e) {
      failed++
      Logger.error(e)
    }
  }

  Logger.debug(`Augur: ${succeeded} resolved markets`)
  Logger.debug(`Augur: ${failed} markets failed to resolve`)

  return Requester.success(jobRunID, {})
}
