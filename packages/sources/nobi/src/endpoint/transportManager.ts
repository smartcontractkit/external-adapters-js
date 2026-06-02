/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { NobiWsTransport } from '../transport/price'
import { BaseEndpointTypes } from './price'

const logger = makeLogger('NobiTransportManager')

// Converts 0 to 'a', 1 to 'b', ..., 25 to 'z', 26 to 'aa', 27 to 'ab', ...
// CharCode 97 is 'a'
const indexToLetters = (i: number): string => {
  if (i < 26) {
    return String.fromCharCode(97 + i)
  }
  return indexToLetters(Math.floor(i / 26) - 1) + String.fromCharCode(97 + (i % 26))
}

type NobiTransportTracker = {
  transport: NobiWsTransport
  name: string
  requestCount: number
}

export class NobiTransportManager {
  transportTrackers: NobiTransportTracker[] = []
  // Map base/quote pairs to transport names to ensure the same pair always goes to the same transport
  requestTrackers: Map<string, string> = new Map()

  maxTransports: number
  maxSubscriptionsPerTransport: number

  constructor(maxTransports?: number, maxSubscriptionsPerTransport?: number) {
    this.maxTransports = maxTransports ?? (parseInt(process.env.MAX_TRANSPORTS ?? '') || 10)
    this.maxSubscriptionsPerTransport =
      maxSubscriptionsPerTransport ??
      (parseInt(process.env.MAX_SUBSCRIPTIONS_PER_TRANSPORT ?? '') || 100)
    this.createTransports()
  }

  // pre-create maxTransports number of transports
  createTransports() {
    for (let i = 0; i < this.maxTransports; i++) {
      const tracker = {
        transport: new NobiWsTransport(),
        name: `ws${indexToLetters(i)}`,
        requestCount: 0,
      }
      this.transportTrackers.push(tracker)
    }
  }

  setupTransportRoutes() {
    const transportRoutes = new TransportRoutes<BaseEndpointTypes>()
    for (const tracker of this.transportTrackers) {
      transportRoutes.register(tracker.name, tracker.transport)
    }
    return transportRoutes
  }

  getDefaultTransportName() {
    return this.transportTrackers[0]!.name
  }

  routeRequest(base: string, quote: string) {
    // Check whether pair already routed to a given transport in requestTrackers
    const pair = `${base}/${quote}`
    const transportName = this.requestTrackers.get(pair)
    if (transportName) {
      return transportName
    }

    // If not, find the first transport with available capacity and route to it; update requestTrackers and transportTrackers
    // requestCount is intentionally add-only, no decrement to simplify routing in case some requests are infrequent but long-lived
    // This router manages capacity and lets the underlying transport handle subscribe/unsubscribe logic for its given set of pairs
    for (let i = 0; i < this.maxTransports; i++) {
      const transportTracker = this.transportTrackers[i]!
      if (transportTracker.requestCount < this.maxSubscriptionsPerTransport) {
        transportTracker.requestCount++
        if (transportTracker.requestCount >= this.maxSubscriptionsPerTransport) {
          logger.info(
            `Transport ${transportTracker.name} has reached max subscription capacity with ${transportTracker.requestCount} subscriptions.`,
          )
        }
        this.requestTrackers.set(pair, transportTracker.name)
        return transportTracker.name
      }
    }

    // If all transports are at capacity, throw an error
    throw new Error('Unable to route request: all transports are at capacity')
  }
}

export const transportManager = new NobiTransportManager()
