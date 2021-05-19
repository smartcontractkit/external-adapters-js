import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute, AdapterResponse, AdapterRequest } from '@chainlink/types'
import { Config } from '../config'
import { ABI, bytesMappingToHexStr, numToEventId } from './index'
import { ethers } from 'ethers'
import { theRundown, sportsdataio } from '../dataProviders'

const resolveParams = {
  contractAddress: true
}

const eventStatus: { [key: string]: number } = {
  'STATUS_SCHEDULED': 1,
  'STATUS_FINAL': 2,
  'STATUS_POSTPONED': 3,
  'STATUS_CANCELED': 4
}

export interface Event {
  id: ethers.BigNumber
  status: number
  homeScore: number
  awayScore: number
}

const statusCompleted = [
  eventStatus['STATUS_CANCELED'],
  eventStatus['STATUS_FINAL'],
  eventStatus['STATUS_POSTPONED']
]

const tryGetEvent = async (dataProviders: Execute[], req: AdapterRequest): Promise<AdapterResponse> => {
  let exception
  for (let i = 0; i < dataProviders.length; i++) {
    try {
      return await dataProviders[i](req)
    } catch (e) {
      Logger.error(e)
      exception = e
    }
  }
  throw exception
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const contractAddress = validator.validated.data.contractAddress
  const contract = new ethers.Contract(contractAddress, ABI, config.wallet)

  const eventIDs: ethers.BigNumber[] = await contract.listResolvableEvents()
  const events: Event[] = []
  for (const event of eventIDs) {
    try {
      const response = await tryGetEvent([theRundown.resolve, sportsdataio.resolve], {
        id: input.id,
        data: {
          endpoint: 'event',
          eventId: numToEventId(event)
        }
      })
      events.push(response.result as Event)
    } catch (e) {
      Logger.error(e)
    }
  }

  // Filters out events that aren't yet ready to resolve.
  const eventReadyToResolve = events
    .filter(({ status }) => statusCompleted.includes(status))

  // Build the bytes32 arguments to resolve the events.
  const packed = eventReadyToResolve
    .map((event) => packResolution(event.id, event.status, event.homeScore, event.awayScore))

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < eventReadyToResolve.length; i++) {
    Logger.info(`Augur: resolving event "${eventReadyToResolve[i].id}"`)

    // This call both resolves markets and finalizes their resolution.
    const tx = await contract.trustedResolveMarkets(packed[i], { nonce: nonce++ })
    Logger.info(`Augur: Created tx: ${tx.hash}`)
  }

  return Requester.success(input.id, {})
}

export const packResolution = (
  eventId: ethers.BigNumber,
  eventStatus: number,
  homeScore: number,
  awayScore: number
): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint8', 'uint16', 'uint16'],
    [eventId, eventStatus, Math.round(homeScore*10), Math.round(awayScore*10)]
  )

  const mapping = [16, 1, 2, 2]
  return bytesMappingToHexStr(mapping, encoded)
}
