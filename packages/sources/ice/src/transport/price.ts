import {
  EndpointContext,
  LwbaEndpointGenerics,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import {
  makeLogger,
  ResponseGenerics,
  sleep,
  TimestampedAdapterResponse,
} from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/price'
import { InstrumentPartialUpdate, PartialPriceUpdate, StreamingClient } from './netdania'

const logger = makeLogger('NetDaniaStreamingTransport')

export interface ResponseSchema {
  [key: string]: {
    price: number
    errorMessage?: string
  }
}

// HttpTransport extends base types from endpoint and adds additional, Provider-specific types like 'RequestBody', which is the type of
// request body (not the request to adapter, but the request that adapter sends to Data Provider), and 'ResponseBody' which is
// the type of raw response from Data Provider
export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

type FullPriceUpdate = Required<PartialPriceUpdate> & {
  firstTs: number
  version: number // incremented on each update; useful to disambiguate updates with the same ts
}

export class NetDaniaStreamingTransport extends StreamingTransport<LwbaEndpointGenerics> {
  private client: StreamingClient
  private localCache: Map<string, FullPriceUpdate> = new Map()

  constructor() {
    super()
    this.client = new StreamingClient(config.settings)
    this.client.on('price', async (update: InstrumentPartialUpdate) => {
      // get base and quote from the instrument name in the requestIdToInstrument map
      const base = update.instrument.substring(0, 3)
      const quote = update.instrument.substring(3, 6)

      logger.trace(`Received price update for ${base}/${quote}: ${JSON.stringify(update.data)}`)

      const coalesced: FullPriceUpdate = this.coalesce(update)

      const bidAskMidResponse: TimestampedAdapterResponse<
        ResponseGenerics & LwbaResponseDataFields
      > = {
        result: null,
        data: {
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
  }

  private coalesce(update: InstrumentPartialUpdate): FullPriceUpdate {
    const got = this.localCache.get(update.instrument)
    if (!got) {
      if (
        !update.data.bid ||
        !update.data.mid ||
        !update.data.ask ||
        !update.data.ts ||
        !update.data.timezone
      ) {
        throw new Error(`Invalid update for ${update.instrument}: ${JSON.stringify(update.data)}`)
      } else {
        const prime = {
          bid: update.data.bid,
          mid: update.data.mid,
          ask: update.data.ask,
          firstTs: update.data.ts, // first timestamp, remains
          ts: update.data.ts, // current timestamp, will be updated
          timezone: update.data.timezone,
          version: 1, // first version
        } as FullPriceUpdate
        this.localCache.set(update.instrument, prime)
        return prime
      }
    } else {
      const coalesced: FullPriceUpdate = { ...got, ...update.data, version: got.version + 1 }
      this.localCache.set(update.instrument, coalesced)
      return coalesced
    }
  }

  override getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WS_SUBSCRIPTION_TTL
  }

  override async streamHandler(
    context: EndpointContext<BaseEndpointTypes>,
    subscriptions: SubscriptionDeltas<{ base: string; quote: string }>,
  ): Promise<void> {
    await Promise.all([this.unsubscribe(subscriptions.stale), this.subscribe(subscriptions.new)])
    await this.ensureFlushed()
    await this.ensureDesired(subscriptions.desired)

    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  private async ensureFlushed() {
    await this.client.flush()
  }

  private async ensureDesired(desired: { base: string; quote: string }[]) {
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
      await this.client.removeInstruments(undesired)
    }
    if (unincluded.length > 0) {
      logger.warn(
        `Found unincluded desired instruments still active: ${unincluded}. Subscribing (again?).`,
      )
      await this.client.addInstruments(unincluded)
    }
  }

  private pairToInstrument(pair: { base: string; quote: string }): string {
    return `${pair.base}${pair.quote}`
  }

  private async unsubscribe(stale: { base: string; quote: string }[]) {
    logger.info(`Unsubscribing from pairs ${stale}`)
    return this.client.removeInstruments(stale.map(this.pairToInstrument))
  }

  private async subscribe(fresh: { base: string; quote: string }[]) {
    logger.info(`Subscribing to pairs ${fresh}`)
    return this.client.addInstruments(fresh.map(this.pairToInstrument))
  }
}

export const transport = new NetDaniaStreamingTransport()
