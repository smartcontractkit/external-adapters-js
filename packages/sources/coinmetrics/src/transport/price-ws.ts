import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { VALID_QUOTES } from '../config'
import { assetMetricsInputParameters, BaseEndpointTypes } from '../endpoint/price'
import { logPossibleSolutionForKnownErrors } from './error-handling'
import { ResponseError } from './types'

const logger = makeLogger('CoinMetrics WS')

// base currencies that break the ws connection
export const invalidBaseAssets: string[] = []

// Metrics that an asset does not support, by asset, e.g. win -> {ReferenceRateBTC}.
// The stream sends every metric for every asset, and the provider rejects the whole stream
// when one asset does not support one metric. So an asset is left out of the stream while
// the stream has a metric that the asset does not support.
export const unsupportedAssetMetrics = new Map<string, Set<string>>()

// e.g. "Bad parameter 'assets'. Value 'ohmv2' is not supported."
const INVALID_ASSET_MESSAGE = /^Bad parameter 'assets'\. Value '([^']+)' is not supported/
// e.g. "Metric 'ReferenceRateBTC' with frequency '1s' is not supported for 'win'."
const UNSUPPORTED_METRIC_MESSAGE =
  /^Metric '([^']+)' with frequency '[^']+' is not supported for '([^']+)'/

const metricName = (quote: string) => `ReferenceRate${quote.toUpperCase()}`

const isUnsupported = (base: string, metric: string) =>
  unsupportedAssetMetrics.get(base.toLowerCase())?.has(metric) ?? false

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

  //remove assets from desiredSubs that are invalid
  desiredSubs = desiredSubs.filter(({ base }) => !invalidBaseAssets.includes(base.toLowerCase()))

  // remove the pairs that the provider does not support: they can never get a value
  desiredSubs = desiredSubs.filter(({ base, quote }) => !isUnsupported(base, metricName(quote)))

  // remove the assets that do not support a metric of the stream. This can remove the last
  // sub of a metric, so repeat until no sub is removed.
  let settled = false
  while (!settled) {
    const streamMetrics = new Set(desiredSubs.map(({ quote }) => metricName(quote)))
    const kept = desiredSubs.filter(
      ({ base }) => ![...streamMetrics].some((metric) => isUnsupported(base, metric)),
    )
    settled = kept.length === desiredSubs.length
    desiredSubs = kept
  }

  const assets = [...new Set(desiredSubs.map((sub) => sub.base.toLowerCase()))].sort().join(',')
  const metrics = [...new Set(desiredSubs.map((sub) => metricName(sub.quote)))].sort().join(',')
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

    const { type, message: errorMessage } = message.error
    const unsupportedMetric = errorMessage.match(UNSUPPORTED_METRIC_MESSAGE)
    const invalidAsset = errorMessage.match(INVALID_ASSET_MESSAGE)
    if ((type === 'bad_parameter' || type === 'bad_parameters') && unsupportedMetric) {
      // type: 'bad_parameters'
      // message: 'Metric 'ReferenceRateBTC' with frequency '1s' is not supported for 'win'.'
      const [, metric, providerAsset] = unsupportedMetric
      const asset = providerAsset.toLowerCase()
      const metrics = unsupportedAssetMetrics.get(asset) ?? new Set<string>()
      metrics.add(metric)
      unsupportedAssetMetrics.set(asset, metrics)
      logger.warn(
        `Leaving out asset '${asset}' while the stream has metric '${metric}', which it does not support`,
      )
    } else if (type === 'bad_parameters' && invalidAsset) {
      if (!invalidBaseAssets.includes(invalidAsset[1])) {
        invalidBaseAssets.push(invalidAsset[1])
      }
    } else if (type === 'bad_parameter') {
      //Bad Parameter Error Message
      // type: 'bad_paramter'
      // message: 'Bad parameter 'assets'. Value 'ohmv2' is not supported.'
      const findBaseCurrenciesRegex = new RegExp(/'([^']+)'/g)
      const matches = [...errorMessage.matchAll(findBaseCurrenciesRegex)]

      if (matches.length > 1 && !invalidBaseAssets.includes(matches[1][1])) {
        invalidBaseAssets.push(matches[1][1])
      }
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
