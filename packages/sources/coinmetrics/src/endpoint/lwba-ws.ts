import {
  AdapterEndpoint,
  EndpointContext,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  PartialAdapterResponse,
  ProviderResult,
  ProviderResultGenerics,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'

const logger = makeLogger('CoinMetrics Crypto LWBA WS')

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

export type WsCryptoLwbaEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: number
    mid: number
    ask: number
    asksize: number
    bid: number
    bidsize: number
    spread: number
    Data: {
      result: number
    }
  }
  Provider: {
    WsMessage: WsPairQuoteMessage
  }
}

export type MultiVarResult<T extends ProviderResultGenerics> = {
  params: TypeFromDefinition<T['Parameters']>
  response: PartialAdapterResponse<T['Response']> & {
    mid: number
    ask: number
    asksize: number
    bid: number
    bidsize: number
    spread: number
  }
}

export type WsCryptoLwbaSuccessResponse = {
  pair: string
  time: string
  ask_price: string
  ask_size: string
  bid_price: string
  bid_size: string
  mid_price: string
  spread: string
  cm_sequence_id: string
}
export type WsCryptoLwbaErrorResponse = {
  error: {
    type: string
    message: string
  }
}
export type WsCryptoLwbaWarningResponse = {
  warning: {
    type: string
    message: string
  }
}
export type WsCryptoLwbaReorgResponse = {
  time: string
  asset: string
  height: number
  hash: string
  parent_hash: string
  type: 'reorg'
  cm_sequence_id: number
}

type WsPairQuoteMessage =
  | WsCryptoLwbaSuccessResponse
  | WsCryptoLwbaWarningResponse
  | WsCryptoLwbaErrorResponse
  | WsCryptoLwbaReorgResponse

export const calculatPairQuotesUrl = (
  context: EndpointContext<WsCryptoLwbaEndpointTypes>,
  desiredSubs: (typeof inputParameters.validated)[],
): string => {
  const { API_KEY, WS_API_ENDPOINT } = context.adapterSettings
  const pairs = [
    ...new Set(desiredSubs.map((sub) => `${sub.base.toLowerCase()}-${sub.quote.toLowerCase()}`)),
  ].join(',')
  const generated = new URL('/v4/timeseries-stream/pair-quotes', WS_API_ENDPOINT)
  generated.searchParams.append('pairs', pairs)
  generated.searchParams.append('api_key', API_KEY)
  logger.debug(`Generated URL: ${generated.toString()}`)
  return generated.toString()
}

export const handleCryptoLwbaMessage = (
  message: WsPairQuoteMessage,
): MultiVarResult<WsCryptoLwbaEndpointTypes>[] | undefined => {
  if ('error' in message) {
    logger.error(message, `Error response from websocket`)
  } else if ('warning' in message) {
    logger.warn(message, `Warning response from websocket`)
  } else if ('type' in message && message.type === 'reorg') {
    logger.info(message, `Reorg response from websocket`)
  } else if ('mid_price' in message) {
    const [base, quote] = message.pair.split('-')
    const res = Number(message.mid_price)
    return [
      {
        params: {
          base,
          quote,
        },
        response: {
          result: res,
          mid: res,
          ask: Number(message.ask_price),
          asksize: Number(message.ask_size),
          bid: Number(message.bid_price),
          bidsize: Number(message.bid_size),
          spread: Number(message.spread),
          data: {
            result: res,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(message.time).getTime(),
          },
        },
      },
    ]
  } else {
    logger.warn(message, 'Unknown message type from websocket')
  }
  return undefined
}

export const wsTransport = new WebSocketTransport<WsCryptoLwbaEndpointTypes>({
  url: (context, desiredSubs) => {
    return calculatPairQuotesUrl(context, desiredSubs)
  },
  handlers: {
    message(message: WsPairQuoteMessage): ProviderResult<WsCryptoLwbaEndpointTypes>[] | undefined {
      return handleCryptoLwbaMessage(message)
    },
  },
})

export const endpoint = new AdapterEndpoint<WsCryptoLwbaEndpointTypes>({
  name: 'crypto-lwba',
  aliases: ['crypto_lwba'],
  transport: wsTransport,
  inputParameters,
})
