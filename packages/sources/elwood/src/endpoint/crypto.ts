import {
  CryptoPriceEndpoint,
  EndpointContext,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import axios from 'axios'
import { config } from '../config'

const logger = makeLogger('ElwoodWsPrice')

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

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

type CryptoEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    WsMessage: ResponseMessage
  }
}

const transport = new (class extends WebSocketTransport<CryptoEndpointTypes> {
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
    context: EndpointContext<CryptoEndpointTypes>,
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
export const cryptoEndpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['crypto'],
  inputParameters,
  transport,
})
