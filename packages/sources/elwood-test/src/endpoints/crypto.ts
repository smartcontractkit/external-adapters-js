import {
  EndpointContext,
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import axios from 'axios'
import { customSettings } from '../config'

export type SubscribeRequest = {
  action: 'subscribe' | 'unsubscribe'
  stream: 'index'
  symbol: string
  index_freq: number
}

export type PriceResponse = {
  type: 'Index'
  data: {
    price: string
    symbol: string
    timestamp: string
  }
  sequence: number
}

export type HeartbeatResponse = {
  type: 'heartbeat'
  data: string
  sequence: number
}

export type ErrorResponse = {
  type: unknown
  error: Record<string, unknown>
}

export type ResponseMessage = PriceResponse | HeartbeatResponse

type CryptoEndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: {
    Data: SingleNumberResultResponse
    Result: number
  }
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: ResponseMessage
  }
}

const transport = new (class extends WebSocketTransport<CryptoEndpointTypes> {
  constructor() {
    super({
      url: (context) =>
        `${context.adapterConfig.WS_API_ENDPOINT}?apiKey=${context.adapterConfig.API_KEY}`,
      handlers: {
        message(message) {
          if (!message.data) {
            return
          }
          if (message.type === 'Index') {
            const [base, quote] = message.data.symbol.split('-')
            const value = Number(message.data.price)

            return [
              {
                params: {
                  base,
                  quote,
                },
                value,
              },
            ]
          }
          return
        },
      },
      builders: {
        subscribeMessage: (params): SubscribeRequest => ({
          action: 'subscribe',
          stream: 'index',
          symbol: `${params.base}-${params.quote}`,
          index_freq: 1_000, // Milliseconds
        }),
        unsubscribeMessage: (params): SubscribeRequest => ({
          action: 'unsubscribe',
          stream: 'index',
          symbol: `${params.base}-${params.quote}`,
          index_freq: 1_000, // Milliseconds
        }),
      },
    })
  }

  override async sendMessages(
    context: EndpointContext<CryptoEndpointTypes>,
    subscribes: unknown[],
    unsubscribes: unknown[],
  ): Promise<void> {
    const messages = subscribes.concat(unsubscribes)
    for (const message of messages) {
      axios.request({
        url: `${context.adapterConfig.API_ENDPOINT}?apiKey=${context.adapterConfig.API_KEY}`,
        method: 'post',
        data: message,
      })
    }
  }
})()
export const cryptoEndpoint = new PriceEndpoint({
  name: 'price',
  aliases: ['crypto'],
  inputParameters: priceEndpointInputParameters,
  transport,
})
