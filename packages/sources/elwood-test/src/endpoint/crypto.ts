import {
  EndpointContext,
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import axios from 'axios'
import { customSettings } from '../config'

const logger = makeLogger('ElwoodWsPrice')

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
  Response: SingleNumberResultResponse
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
          if (message.type !== 'Index') {
            return
          }

          if (!message.data) {
            logger.warn(`Got no data in WS message of type Index`)
            return
          }

          if (typeof message.data?.symbol !== 'string') {
            logger.warn(
              `Got non string symbol "${message.data?.symbol}" in WS message of type Index`,
            )
            return
          }

          const [base, quote] = message.data.symbol.split('-')
          if (!base || !quote) {
            logger.warn(`Got invalid symbol "${message.data?.symbol}" in WS message of type Index`)
            return
          }

          const value = Number(message.data.price)
          if (value < 0) {
            logger.warn(`Got invalid price "${message.data.price}" in WS message of type Index`)
            return
          }

          return [
            {
              params: {
                base,
                quote,
              },
              response: {
                result: value,
                data: { result: value },
                timestamps: {
                  providerIndicatedTime: new Date(message.data.timestamp).getTime(),
                },
              },
            },
          ]
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
