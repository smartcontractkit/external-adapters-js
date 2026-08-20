import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  makeLogger,
  PartialAdapterResponse,
  ProviderResult,
  ProviderResultGenerics,
} from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, inputParameters } from '../endpoint/lwba'
import { logPossibleSolutionForKnownErrors } from './error-handling'
import { ResponseError } from './types'

const logger = makeLogger('CoinMetrics Crypto LWBA WS')

export type MultiVarResult<T extends ProviderResultGenerics> = {
  params: TypeFromDefinition<T['Parameters']>
  response: PartialAdapterResponse<T['Response']>
}

export type WsCryptoLwbaQuoteFields = {
  time: string
  ask_price: string
  ask_size: string
  bid_price: string
  bid_size: string
  mid_price: string
  spread: string
  cm_sequence_id: string
}

/** Response shape from `/timeseries-stream/asset-quotes` */
export type WsCryptoLwbaAssetQuoteSuccessResponse = WsCryptoLwbaQuoteFields & {
  asset: string
}

/** Legacy response shape from `/timeseries-stream/pair-quotes` */
export type WsCryptoLwbaPairQuoteSuccessResponse = WsCryptoLwbaQuoteFields & {
  pair: string
}

export type WsCryptoLwbaSuccessResponse =
  | WsCryptoLwbaAssetQuoteSuccessResponse
  | WsCryptoLwbaPairQuoteSuccessResponse
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
  } else if ('warning' in message) {
    logger.warn(message, `Warning response from websocket`)
  } else if ('type' in message && message.type === 'reorg') {
    logger.info(message, `Reorg response from websocket`)
  } else if ('mid_price' in message) {
    let base: string
    let quote: string
    if ('asset' in message) {
      base = message.asset
      quote = 'USD'
    } else if ('pair' in message) {
      const [pairBase, pairQuote] = message.pair.split('-')
      base = pairBase
      quote = pairQuote ?? 'USD'
    } else {
      logger.warn('LWBA quote message missing asset or pair field')
      return undefined
    }
    const bid = Number(message.bid_price)
    const mid = Number(message.mid_price)
    const ask = Number(message.ask_price)
    if (bid && mid && ask && (mid < bid || mid > ask)) {
      // CoinMetrics can occasionally emit a snapshot where bid ≤ mid ≤ ask doesn't hold,
      // typically due to timing skew between the bid, mid, and ask updates on thinner markets.
      // The framework's LWBA output validation will reject this when served; log it here so the
      // skewed snapshot is attributable to the provider (and asset) rather than only surfacing
      // as a per-request validation error.
      logger.warn(
        { base, bid, mid, ask, time: message.time },
        'CoinMetrics LWBA snapshot violates bid ≤ mid ≤ ask (likely timing skew between updates)',
      )
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
            bid,
            mid,
            ask,
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
