import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'
import * as TheRundown from '@chainlink/therundown-adapter'
import { ABI, Event, eventIdToNum, bytesMappingToHexStr, numToEventId } from './index'
import { ethers } from 'ethers'

const resolveParams = {
  sportId: true,
  contractAddress: true
}

const subDays = (date: Date, days: number): Date => {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() - days)
  return newDate
}

const eventStatus: { [key: string]: number } = {
  'STATUS_SCHEDULED': 1,
  'STATUS_FINAL': 2,
  'STATUS_POSTPONED': 3,
  'STATUS_CANCELED': 4
}

const statusCompleted = [
  'STATUS_CANCELED',
  'STATUS_FINAL',
  'STATUS_POSTPONED'
]

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const contractAddress = validator.validated.data.contractAddress

  const contract = new ethers.Contract(contractAddress, ABI, config.wallet)

  const theRundownExec = TheRundown.makeExecute()

  const eventIDs: ethers.BigNumber[] = await contract.listResolvableEvents();
  const events: Event[] = [];
  for (const event of eventIDs) {
    const response = await theRundownExec({
      id: input.id,
      data: {
        endpoint: 'events',
        eventID: numToEventId(event)
      }
    });
    events.push(response.result as Event);
  }

  // Filters out events that aren't yet ready to resolve.
  const eventReadyToResolve = events
    .filter(({ score: { event_status } }) => statusCompleted.includes(event_status))

  // Build the bytes32 arguments to resolve the events.
  const packed = eventReadyToResolve.map((event) => {
    const status = eventStatus[event.score.event_status]
    return packResolution(event.event_id, status, event.score.score_home, event.score.score_away)
  })

  let succeeded = 0
  let failed = 0
  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < eventReadyToResolve.length; i++) {
    const eventId = eventIdToNum(eventReadyToResolve[i].event_id)

    try {
      // This call both resolves markets and finalizes their resolution.
      await contract.trustedResolveMarkets(packed[i], { nonce })
      nonce++ // update after tx succeeds so that gas estimation failures do not increment nonce
      succeeded++
    } catch (e) {
      // Failures are (now) unexpected. Still, log the event id to make debugging easier.
      failed++
      Logger.error(`Failed to resolve markets for "${eventId}"`)
      throw e;
    }
  }

  Logger.debug(`Augur: ${succeeded} resolved markets`)
  Logger.debug(`Augur: ${failed} markets failed to resolve`)

  return Requester.success(input.id, {})
}

export const packResolution = (
  eventId: string,
  eventStatus: number,
  homeScore: number,
  awayScore: number
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint8', 'uint16', 'uint16'],
    [eventIdToNum(eventId), eventStatus, Math.round(homeScore*10), Math.round(awayScore*10)]
  )

  const mapping = [16, 1, 2, 2]
  return bytesMappingToHexStr(mapping, encoded)
}
