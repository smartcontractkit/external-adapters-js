import { BaseEndpointTypesLwba } from '../endpoint/crypto-lwba'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import {
  DEFAULT_TRANSPORT_NAME,
  EndpointContext,
} from '@chainlink/external-adapter-framework/adapter'
import { buildWsMessage, buildWsUrl, sendMessage, validateWsMessage } from './util'

const logger = makeLogger('ElwoodWsLwba')

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
          buildWsUrl(context.adapterSettings.WS_API_ENDPOINT, context.adapterSettings.API_KEY),
        handlers: {
          message(message) {
            const validatedWsMessage = validateWsMessage(logger, message)
            if (!validatedWsMessage) {
              return
            }
            const { base, quote, result, bid, ask, timestamp } = validatedWsMessage

            return [
              {
                params: {
                  base,
                  quote,
                },
                response: {
                  result: null,
                  data: {
                    bid: bid,
                    ask: ask,
                    mid: result,
                  },
                  timestamps: {
                    providerIndicatedTimeUnixMs: timestamp,
                  },
                },
              },
            ]
          },
        },
        builders: {
          subscribeMessage: (params): SubscribeRequest => buildWsMessage('subscribe', params),
          unsubscribeMessage: (params): SubscribeRequest => buildWsMessage('unsubscribe', params),
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
        sendMessage(
          context.adapterSettings.API_ENDPOINT,
          context.adapterSettings.API_KEY,
          message,
        ).catch(async (error) => {
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
