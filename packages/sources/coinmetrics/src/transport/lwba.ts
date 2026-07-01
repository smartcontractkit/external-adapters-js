import { BaseEndpointTypes, inputParameters } from '../endpoint/lwba'
import {
  makeLogger,
  PartialAdapterResponse,
  ProviderResult,
  ProviderResultGenerics,
} from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { logPossibleSolutionForKnownErrors } from './error-handling'
import { ResponseError } from './types'

const logger = makeLogger('CoinMetrics Crypto LWBA WS')
// base currencies that break the ws connection
export const invalidBaseAssets: string[] = []

export type MultiVarResult<T extends ProviderResultGenerics> = {
  params: TypeFromDefinition<T['Parameters']>
  response: PartialAdapterResponse<T['Response']>
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
  error: ResponseError
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

export type WsPairQuoteMessage =
  | WsCryptoLwbaSuccessResponse
  | WsCryptoLwbaWarningResponse
  | WsCryptoLwbaErrorResponse
  | WsCryptoLwbaReorgResponse

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsPairQuoteMessage
  }
}
export const calculateUrl = (
  context: EndpointContext<WsTransportTypes>,
  desiredSubs: (typeof inputParameters.validated)[],
): string => {
  const { API_KEY, WS_API_ENDPOINT } = context.adapterSettings

  //remove assets from desiredSubs that are invalid
  desiredSubs = desiredSubs.filter(({ base }) => !invalidBaseAssets.includes(base.toLowerCase()))

  const generated = new URL('/v4/timeseries-stream/asset-quotes', WS_API_ENDPOINT)
  const assets = [...new Set(desiredSubs.map((pair) => pair.base.toLowerCase()))].sort().join(',')
  generated.searchParams.append('assets', assets)

  generated.searchParams.append('api_key', API_KEY)
  logger.debug(`Generated URL: ${generated.toString()}`)
  return generated.toString()
}

export const handleCryptoLwbaMessage = (
  message: WsPairQuoteMessage,
): MultiVarResult<WsTransportTypes>[] | undefined => {
  if ('error' in message) {
    logger.error(message, `Error response from websocket`)
    logPossibleSolutionForKnownErrors(message.error)

    const findBaseCurrenciesRegex = new RegExp(/'([^']+)'/g)
    if (message['error']['type'] === 'bad_parameter') {
      //Bad Parameter Error Message
      // type: 'bad_paramter'
      // message: 'Bad parameter 'assets'. Value 'ohmv2' is not supported.'

      const matches = [...message.error.message.matchAll(findBaseCurrenciesRegex)]

      if (matches && !invalidBaseAssets.includes(matches[1][1])) {
        invalidBaseAssets.push(matches[1][1])
      }
    }
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
          result: null,
          data: {
            bid: Number(message.bid_price),
            mid: res,
            ask: Number(message.ask_price),
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

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context, desiredSubs) => {
    return calculateUrl(context, desiredSubs)
  },
  handlers: {
    message(message: WsPairQuoteMessage): ProviderResult<WsTransportTypes>[] | undefined {
      return handleCryptoLwbaMessage(message)
    },
  },
})
