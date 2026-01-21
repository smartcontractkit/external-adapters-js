import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { LocalPriceCache } from './cache'
import { InstrumentPartialUpdate, PartialPriceUpdate, StreamingClient } from './netdania'

const logger = makeLogger('ice: StreamingTransport')

export type FullPriceUpdate = Required<PartialPriceUpdate> & {
  firstTs: number
  version: number // incremented on each update; useful to disambiguate updates with the same ts
}

export class NetDaniaStreamingTransport extends StreamingTransport<BaseEndpointTypes> {
  private client!: StreamingClient
  private localCache: LocalPriceCache = new LocalPriceCache()
  private currentSubscriptions: { base: string; quote: string }[] = []

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ) {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.client = new StreamingClient(adapterSettings)

    // Listen for price updates
    this.client.on('price', async (update: InstrumentPartialUpdate) => {
      // get base and quote from the instrument name in the requestIdToInstrument map
      const base = update.instrument.substring(0, 3)
      const quote = update.instrument.substring(3, 6)

      logger.trace(`Received price update for ${base}/${quote}: ${JSON.stringify(update.data)}`)

      const coalesced: FullPriceUpdate = this.localCache.coalesceAndGet(update)

      const bidAskMidResponse = {
        result: coalesced.mid,
        data: {
          result: coalesced.mid,
          bid: coalesced.bid,
          mid: coalesced.mid,
          ask: coalesced.ask,
        },
        timestamps: {
          providerDataStreamEstablishedUnixMs: coalesced.firstTs * 1000,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: coalesced.ts * 1000,
        },
      }
      await this.responseCache.write(this.name, [
        {
          params: {
            base: base,
            quote: quote,
          },
          response: bidAskMidResponse,
        },
      ])
    })

    // LVP: Listen for heartbeat events to extend cache TTLs during off-market hours
    this.client.on('heartbeat', async () => {
      await this.updateTTL(adapterSettings.CACHE_MAX_AGE)
    })
  }

  /**
   * LVP (Last Value Persistence): Extends TTL for all currently subscribed pairs.
   * This ensures cached prices remain available during off-market hours when
   * no price updates are being received from the data provider.
   */
  private async updateTTL(ttl: number): Promise<void> {
    if (this.currentSubscriptions.length === 0) {
      logger.debug('LVP updateTTL: No active subscriptions to refresh')
      return
    }

    logger.debug(
      `LVP updateTTL: Extending TTL for ${this.currentSubscriptions.length} subscriptions by ${ttl}ms`,
    )

    this.responseCache.writeTTL(this.name, this.currentSubscriptions, ttl)
  }

  override getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WS_SUBSCRIPTION_TTL
  }

  override async streamHandler(
    context: EndpointContext<BaseEndpointTypes>,
    subscriptions: SubscriptionDeltas<{ base: string; quote: string }>,
  ): Promise<void> {
    this.unsubscribe(subscriptions.stale)
    this.subscribe(subscriptions.new)
    this.client.flush()

    // reconcile: should be redundant
    this.ensureDesired(subscriptions.desired)

    // LVP: Track current subscriptions for TTL refresh during off-market hours
    this.currentSubscriptions = subscriptions.desired

    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  private ensureDesired(desired: { base: string; quote: string }[]) {
    const currentInstruments = this.client.getActiveInstruments()
    const desiredInstruments = desired.map(this.pairToInstrument)

    const undesired = currentInstruments.filter(
      (instrument) => !desiredInstruments.includes(instrument),
    )
    const unincluded = desiredInstruments.filter(
      (instrument) => !currentInstruments.includes(instrument),
    )

    if (undesired.length > 0) {
      logger.warn(
        `Found undesired included instruments still active: ${undesired}. Unsubscribing (again?).`,
      )
      this.client.removeInstruments(undesired)
    }
    if (unincluded.length > 0) {
      logger.warn(
        `Found unincluded desired instruments still active: ${unincluded}. Subscribing (again?).`,
      )
      this.client.addInstruments(unincluded)
    }
  }

  private pairToInstrument(pair: { base: string; quote: string }): string {
    return `${pair.base}${pair.quote}`
  }

  private unsubscribe(stale: { base: string; quote: string }[]) {
    if (stale.length > 0) {
      logger.info(`Unsubscribing from pairs ${JSON.stringify(stale)}`)
      const instruments = stale.map(this.pairToInstrument)
      this.client.removeInstruments(instruments)
      this.localCache.drop(instruments)
    }
  }

  private subscribe(fresh: { base: string; quote: string }[]) {
    if (fresh.length <= 0) {
      return []
    }

    logger.info(`Subscribing to pairs ${JSON.stringify(fresh)}`)
    return this.client.addInstruments(fresh.map(this.pairToInstrument))
  }
}

export const transport = new NetDaniaStreamingTransport()
