import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Execute } from '@chainlink/types'
import { Config } from '../config'
import { ABI, bytesMappingToHexStr } from './index'
import { ethers } from 'ethers'
import { theRundown, sportsdataio } from '../dataProviders'

const resolveParams = {
  contractAddress: true,
  sport: true,
}

const eventStatus: { [key: string]: number } = {
  'STATUS_SCHEDULED': 1,
  'STATUS_FINAL': 2,
  'STATUS_POSTPONED': 3,
  'STATUS_CANCELED': 4
}

export interface ResolveEvent {
  id: ethers.BigNumber
  status: number
  homeScore: number
  awayScore: number
}

const statusCompleted = [
  eventStatus['STATUS_CANCELED'],
  eventStatus['STATUS_FINAL'],
  eventStatus['STATUS_POSTPONED']
  // TODO: What about other statuses in sportsdataio?
]

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, resolveParams)
  if (validator.error) throw validator.error

  const sport = validator.validated.data.sport.toLowerCase()
  const contractAddress = validator.validated.data.contractAddress
  const contract = new ethers.Contract(contractAddress, ABI, config.wallet)

  let getEvent: Execute
  if (theRundown.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = theRundown.resolve
  } else if (sportsdataio.SPORTS_SUPPORTED.includes(sport)) {
    getEvent = sportsdataio.resolve
  } else {
    throw Error(`Unknown data provider for sport ${sport}`)
  }

  const eventIDs: ethers.BigNumber[] = await contract.listResolvableEvents()
  const events: ResolveEvent[] = []
  for (const eventId of eventIDs) {
    try {
      const response = await getEvent({
        id: input.id,
        data: {
          sport,
          eventId
        }
      })
      events.push(response.result as ResolveEvent)
    } catch (e) {
      Logger.error(e)
    }
  }

  // Filters out events that aren't yet ready to resolve.
  const eventReadyToResolve = events
    .filter(({ status }) => statusCompleted.includes(status))

  // Build the bytes32 arguments to resolve the events.
  const packed = eventReadyToResolve.map(packResolution)

  let nonce = await config.wallet.getTransactionCount()
  for (let i = 0; i < eventReadyToResolve.length; i++) {
    Logger.info(`Augur: resolving event "${eventReadyToResolve[i].id}"`)

    // This call both resolves markets and finalizes their resolution.
    const tx = await contract.trustedResolveMarkets(packed[i], { nonce: nonce++ })
    Logger.info(`Augur: Created tx: ${tx.hash}`)
  }

  return Requester.success(input.id, {})
}

const packResolution = (event: ResolveEvent): string => {
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['uint128', 'uint8', 'uint16', 'uint16'],
    [event.id, event.status, Math.round(event.homeScore*10), Math.round(event.awayScore*10)]
  )

  const mapping = [16, 1, 2, 2]
  return bytesMappingToHexStr(mapping, encoded)
}
