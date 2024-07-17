import { BaseEndpointTypesLwba } from '../endpoint/crypto-lwba'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import axios from 'axios'

const logger = makeLogger('ElwoodWsLwba')

const DEFAULT_TRANSPORT_NAME = 'default_single_transport'

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
    bid: string
    ask: string
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

export type WsTransportTypes = BaseEndpointTypesLwba & {
  Provider: {
    WsMessage: ResponseMessage
  }
}

export const transport: WebSocketTransport<WsTransportTypes> =
  new (class extends WebSocketTransport<WsTransportTypes> {
    constructor() {
      super({
        url: (context) =>
          `${context.adapterSettings.WS_API_ENDPOINT}?apiKey=${context.adapterSettings.API_KEY}`,
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
              logger.warn(
                `Got invalid symbol "${message.data?.symbol}" in WS message of type Index`,
              )
              return
            }

            const result = Number(message.data.price)
            if (result < 0) {
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
                  result: null,
                  data: {
                    bid: Number(message.data.bid),
                    ask: Number(message.data.ask),
                    mid: result,
                  },
                  timestamps: {
                    providerIndicatedTimeUnixMs: new Date(message.data.timestamp).getTime(),
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
      context: EndpointContext<WsTransportTypes>,
      subscribes: SubscribeRequest[],
      unsubscribes: SubscribeRequest[],
    ): Promise<void> {
      const messages = subscribes.concat(unsubscribes)
      for (const message of messages) {
        axios
          .request({
            url: `${context.adapterSettings.API_ENDPOINT}?apiKey=${context.adapterSettings.API_KEY}`,
            method: 'post',
            data: message,
          })
          .catch(async (error) => {
            logger.debug(`Failed to ${message.action} the ${message.symbol} pair`)
            const base = message.symbol.split('-')[0]
            const quote = message.symbol.split('-')[1]
            const defaultErrorMsg = `Failed to ${message.action} the ${message.symbol} pair`
            if (error.response) {
              await this.responseCache.write(DEFAULT_TRANSPORT_NAME, [
                {
                  params: {
                    base,
                    quote,
                  },
                  response: {
                    statusCode: error.response.data['error']['code'] || 500,
                    errorMessage: error.response.data['error']['message'] || defaultErrorMsg,
                    timestamps: {
                      providerDataReceivedUnixMs: Date.now(),
                      providerIndicatedTimeUnixMs: undefined,
                      providerDataStreamEstablishedUnixMs: this.providerDataStreamEstablished,
                    },
                  },
                },
              ])
            }
          })
      }
    }
  })()
