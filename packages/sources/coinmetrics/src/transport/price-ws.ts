import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { VALID_QUOTES } from '../config'
import { assetMetricsInputParameters, BaseEndpointTypes } from '../endpoint/price'
import {
  getUnsupportedAssetFromBadParameterError,
  logPossibleSolutionForKnownErrors,
} from './error-handling'
import { ResponseError } from './types'

const logger = makeLogger('CoinMetrics WS')

// base currencies that break the ws connection
export const invalidBaseAssets: string[] = []

export type WsAssetMetricsSuccessResponse = {
  time: string
  asset: string
  height: number
  hash: string
  parent_hash: string
  type: string
  cm_sequence_id: number
  // Below are metrics fields, where the currency at the end is the quote currency
  // Variants for each of config.VALID_QUOTES should be present here
  ReferenceRateUSD?: string
  ReferenceRateEUR?: string
  ReferenceRateETH?: string
  ReferenceRateBTC?: string
}
export type WsAssetMetricsErrorResponse = {
  error: ResponseError
}
export type WsAssetMetricsWarningResponse = {
  warning: {
    type: string
    message: string
  }
}
export type WsAssetMetricsReorgResponse = {
  time: string
  asset: string
  height: number
  hash: string
  parent_hash: string
  type: 'reorg'
  cm_sequence_id: number
}

type WsAssetMetricsMessage =
  | WsAssetMetricsSuccessResponse
  | WsAssetMetricsWarningResponse
  | WsAssetMetricsErrorResponse
  | WsAssetMetricsReorgResponse

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsAssetMetricsMessage
  }
}

export const calculateAssetMetricsUrl = (
  context: EndpointContext<WsTransportTypes>,
  desiredSubs: (typeof assetMetricsInputParameters.validated)[],
): string => {
  const { API_KEY, WS_API_ENDPOINT } = context.adapterSettings

  // Remove assets from desiredSubs that are invalid.
  const validDesiredSubs = desiredSubs.filter(
    ({ base }) => !invalidBaseAssets.includes(base.toLowerCase()),
  )

  const assets = [...new Set(validDesiredSubs.map((sub) => sub.base.toLowerCase()))]
    .sort()
    .join(',')
  if (!assets) {
    logger.warn('No valid assets remain after filtering unsupported assets')
  }

  const metrics = [
    ...new Set(validDesiredSubs.map((sub) => `ReferenceRate${sub.quote.toUpperCase()}`)),
  ]
    .sort()
    .join(',')
  const generated = new URL('/v4/timeseries-stream/asset-metrics', WS_API_ENDPOINT)
  generated.searchParams.append('assets', assets)
  generated.searchParams.append('metrics', metrics)
  generated.searchParams.append('frequency', '1s')
  generated.searchParams.append('api_key', API_KEY)

  logger.debug(`Generated URL: ${generated.toString()}`)
  return generated.toString()
}

export const handleAssetMetricsMessage = (
  message: WsAssetMetricsMessage,
): ProviderResult<WsTransportTypes>[] | undefined => {
  logger.trace(message, 'Got response from websocket')

  if ('error' in message) {
    // Is WsAssetMetricsErrorResponse
    logger.error(message, `Error response from websocket`)
    logPossibleSolutionForKnownErrors(message.error)

    const unsupportedAsset = getUnsupportedAssetFromBadParameterError(message.error)
    if (unsupportedAsset && !invalidBaseAssets.includes(unsupportedAsset)) {
      invalidBaseAssets.push(unsupportedAsset)
      logger.warn({ asset: unsupportedAsset }, 'Added unsupported asset to invalid asset list')
    }
  } else if ('warning' in message) {
    // Is WsAssetMetricsWarningResponse
    logger.warn(message, `Warning response from websocket`)
  } else if ('type' in message && message.type === 'reorg') {
    // Is WsAssetMetricsReorgResponse
    logger.info(message, `Reorg response from websocket`)
  } else if (
    // Is WsAssetMetricsSuccessResponse
    'ReferenceRateUSD' in message ||
    'ReferenceRateEUR' in message ||
    'ReferenceRateBTC' in message ||
    'ReferenceRateETH' in message
  ) {
    return Object.values(VALID_QUOTES)
      .filter((quote) => {
        const val = Number(message[`ReferenceRate${quote}`])
        return val > 0
      })
      .map((quote) => {
        const result = Number(message[`ReferenceRate${quote}`]) || 0 //We have checked for undefined already, this is here so tsc doesn't complain
        return {
          params: {
            base: message.asset,
            quote,
          },
          response: {
            result,
            data: {
              result,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(message.time).getTime(),
            },
          },
        }
      })
  } else {
    logger.warn(message, 'Unknown message type from websocket')
  }
  return []
}

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context, desiredSubs) => {
    return calculateAssetMetricsUrl(context, desiredSubs)
  },
  handlers: {
    message(message: WsAssetMetricsMessage): ProviderResult<WsTransportTypes>[] | undefined {
      return handleAssetMetricsMessage(message)
    },
  },
})
