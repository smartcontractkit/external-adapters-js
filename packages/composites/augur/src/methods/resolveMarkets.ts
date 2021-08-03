import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Execute,
  AdapterContext,
} from '@chainlink/types'
import { Config } from '../config'
import { TEAM_ABI, bytesMappingToHexStr, TEAM_SPORTS, FIGHTER_SPORTS } from './index'
import { ethers } from 'ethers'
import { theRundown, sportsdataio } from '../dataProviders'
import mmaABI from '../abis/mma.json'

const resolveParams = {
  contractAddress: true,
  sport: true,
}

export interface ResolveTeam {
  id: ethers.BigNumber
  status: number
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
}

const statusCompleted = [
  4, // Cancelled
  2, // Final
  3 // Postponed
]

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

const resolveTeam = async (jobRunID: string, sport: string, contractAddress: string, context: AdapterContext, config: Config) => {
  const contract = new ethers.Contract(contractAddress, TEAM_ABI, config.wallet)

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
      const response = await getEvent({
        id: jobRunID,
        data: {
          sport,
          eventId
        }
      }, context)
      events.push(response.result as ResolveTeam)
    } catch (e) {
      Logger.error(e)
    }
  }

  // Filters out events that aren't yet ready to resolve.
  const eventReadyToResolve = events.filter(({ status }) => statusCompleted.includes(status))

  // Build the bytes32 arguments to resolve the events.
  const packed = eventReadyToResolve.map(packResolution)

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < eventReadyToResolve.length; i++) {
    Logger.info(`Augur: resolving event "${eventReadyToResolve[i].id}"`)

    // This call both resolves markets and finalizes their resolution.
    const tx = await contract.trustedResolveMarkets(packed[i], { nonce: nonce++ })
    Logger.info(`Augur: Created tx: ${tx.hash}`)
  }

  return Requester.success(jobRunID, {})
}

const fightStatusMapping: { [key: string]: number } = {
  'unknown': 0,
  'home': 1,
  'away': 2,
  'draw': 3,
}

const resolveFights = async (jobRunID: string, sport: string, contractAddress: string, _: AdapterContext, config: Config) => {
  const contract = new ethers.Contract(contractAddress, mmaABI, config.wallet)

  let getEvent: Execute
  if (theRundown.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = theRundown.resolve
  } else if (sportsdataio.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = sportsdataio.resolveFight
  } else {
    throw Error(`Unknown data provider for sport ${sport}`)
  }

  const eventIDs: ethers.BigNumber[] = await contract.listResolvableEvents()
  const events: ResolveFight[] = []
  for (const eventId of eventIDs) {
    try {
      const response = await getEvent({
        id: jobRunID,
        data: {
          sport,
          eventId
        }
      })
      events.push(response.result as ResolveFight)
    } catch (e) {
      Logger.error(e)
    }
  }

  // Filters out events that aren't yet ready to resolve.
  const eventReadyToResolve = events
    .filter(({ status }) => statusCompleted.includes(status))

  let nonce = await config.wallet.getTransactionCount()
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

    const payload = [
      fight.id,
      fight.status,
      fight.fighterA,
      fight.fighterB,
      fightStatus,
      { nonce: nonce++ }
    ]

    // This call both resolves markets and finalizes their resolution.
    const tx = await contract.trustedResolveMarkets(...payload)
    Logger.info(`Augur: Created tx: ${tx.hash}`)
  }

  return Requester.success(jobRunID, {})
}

const packResolution = (event: ResolveTeam): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint8', 'uint16', 'uint16'],
    [event.id, event.status, Math.round(event.homeScore * 10), Math.round(event.awayScore * 10)],
  )

  const mapping = [16, 1, 2, 2]
  return bytesMappingToHexStr(mapping, encoded)
}
