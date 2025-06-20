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
import { PartialPriceUpdate, StreamingClient } from './netdania'

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

export class NetDaniaStreamingTransport extends StreamingTransport<LwbaEndpointGenerics> {
  private client: StreamingClient
  private requestIdToInstrument: Map<number, string> = new Map()

  constructor() {
    super()
    this.client = new StreamingClient(config.settings)
    this.client.on('price', async (ppu: PartialPriceUpdate) => {
      // get base and quote from the instrument name in the requestIdToInstrument map
      const instrument = this.requestIdToInstrument.get(ppu.id)
      if (!instrument) {
        logger.error(`Received price update for unknown instrument with ID ${ppu.id}`)
        return
      }
      const base = instrument.substring(0, 3)
      const quote = instrument.substring(3, 6)
      logger.info(`Received price update for ${base}/${quote}: ${JSON.stringify(ppu)}`)
      const bidAskMidResponse: TimestampedAdapterResponse<
        ResponseGenerics & LwbaResponseDataFields
      > = {
        result: null,
        data: {
          bid: ppu.bid,
          mid: ppu.mid,
          ask: ppu.ask,
          ticker: ppu.ticker,
          ts: ppu.ts.toString(),
        },
        receivedTs: Date.now(),
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

  override getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WS_SUBSCRIPTION_TTL
  }

  override async streamHandler(
    context: EndpointContext<BaseEndpointTypes>,
    subscriptions: SubscriptionDeltas<{ base: string; quote: string }>,
  ): Promise<void> {
    this.unsubscribe(subscriptions.stale)
    this.subscribe(subscriptions.new)
    this.ensureFlushed()

    sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  private async ensureFlushed() {
    await this.client.flush()
  }

  private unsubscribe(stale: { base: string; quote: string }[]) {
    logger.info(`Unsubscribing from pairs ${stale}`)
  }

  private async subscribe(fresh: { base: string; quote: string }[]) {
    logger.info(`Subscribing to pairs ${fresh}`)
    const instruments = fresh.map((pair) => `${pair.base}${pair.quote}`)
    const requestIds = this.client.addInstruments(instruments)

    // what happens when instrument is already subscribed?
  }
}

export const transport = new NetDaniaStreamingTransport()
