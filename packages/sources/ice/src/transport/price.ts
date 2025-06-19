import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  StreamingTransport,
  SubscriptionDeltas,
} from '@chainlink/external-adapter-framework/transports/abstract/streaming'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/price'
import { StreamingClient } from './netdania'
import { StreamingClientConfig } from './netdania/config'

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

export type PriceResponse = {
  type: 'Price'
  data: {
    price: string
    bid: string
    ask: string
    mid: string
    symbol: string
    lastReceived: string
  }
  sequence: number
}

export interface NetDaniaConnectionConfig {
  host: string
  failoverHosts: string[]
  behavior: number
  pollingInterval: number
  usergroup: string
  password: string
}

export class NetDaniaStreamingTransport extends StreamingTransport<BaseEndpointTypes> {
  private client: StreamingClient

  constructor(public readonly config: StreamingClientConfig) {
    super()
    this.client = new StreamingClient(config)
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
    this.ensureFlushed(context)

    /*
    await Promise.all(
      subscriptions.desired.map(async (subscription) => this.handleRequest(subscription, context)),
    )
*/
    sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  private ensureFlushed(context: EndpointContext<BaseEndpointTypes>) {
    if (!this.client.isConnected()) {
      this.connection.connect(context)
    }
    // This method should ensure that the Streaming connection is established
  }

  private unsubscribe(stale: { base: string; quote: string }[]) {
    logger.info(`Unsubscribing from pairs ${stale}`)
  }

  private subscribe(fresh: { base: string; quote: string }[]) {
    logger.info(`Subscribing to pairs ${fresh}`)
  }
}

// export const transport = new NetDaniaStreamingTransport()

/*
const type SpotBidAskMid = {
  data_provider_name: name,
  request_url: baseUrl,
  base,
  quote,
  ask: convertNaNToNull(parseFloat(dataObject[11])),
  mid: convertNaNToNull(parseFloat(dataObject[9])),
  bid: convertNaNToNull(parseFloat(dataObject[10])),
  last: convertNaNToNull(parseFloat(last)),
  last_update: lastUpdate,
  client_received_timestamp: Date.now(),
}
*/

/*
interface ConnectionConfig {
  host: string
  failoverHosts: string[]
  behavior: any
  pollingInterval: number
  usergroup: string
  password: string
}

type PriceDataItem = {
  f: number
  v: any
}

type PriceResponse = {
  type: number
  id: number
  data: PriceDataItem[]
  modifiedFids: number[]
}
*/
