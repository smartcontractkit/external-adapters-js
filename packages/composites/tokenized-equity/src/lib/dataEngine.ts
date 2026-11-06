import { getDeutscheBoersePrice } from '@chainlink/data-engine-adapter'
// Type-only: data-engine src files are not available at runtime
import type { BaseEndpointTypes as DeutscheBoerseV11Types } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { scaleDecimals } from './decimals'
import { reportTimeMs } from './streams'

/**
 * Data of a data-engine EA v11 response. Prices are integers in the native
 * decimals of the report.
 */
export type DataEngineV11Data = DeutscheBoerseV11Types['Response']['Data']

// Maps the targetEndpoint input parameter to the data-engine EA helper
export const targetEndpoints = {
  v11: getDeutscheBoersePrice,
} as const

export type TargetEndpoint = keyof typeof targetEndpoints

export const targetEndpointNames = Object.keys(targetEndpoints) as TargetEndpoint[]

// Report fields that are prices in the report decimals, so they can be scaled
// and multiplied. Allowed values of the resultPath input parameter.
export const priceFields = ['mid', 'bid', 'ask', 'lastTradedPrice'] as const

export type PriceField = (typeof priceFields)[number]

/**
 * Requests a feed from the data-engine EA and scales the resultPath field from
 * the report decimals to the requested decimals, truncating like the
 * data-engine EA does for its own resultPath (resolveResult).
 */
export const getDataEngineResult = async ({
  url,
  requester,
  targetEndpoint,
  feedId,
  resultPath,
  decimals,
  maxAgeSeconds,
}: {
  url: string
  requester: Requester
  targetEndpoint: TargetEndpoint
  feedId: string
  resultPath: PriceField
  decimals: number
  // Consumer-side staleness check: reject a report whose age
  // (now - lastSeenTimestampNs) exceeds this many seconds. Undefined disables the
  // check. The 24/7 issuer-price-247 stream has no sessions, so only this age
  // check applies to it.
  maxAgeSeconds?: number
}) => {
  // No catch needed: a failed request (4xx/5xx, timeout) is retried by the
  // Requester and thrown as a 502 AdapterError, which the data-engine EA's
  // callEA annotates with the response body. The transport caches it as the
  // error response.
  const data = await targetEndpoints[targetEndpoint](feedId, url, requester)

  if (maxAgeSeconds !== undefined) {
    const ageSeconds = (Date.now() - reportTimeMs(data.lastSeenTimestampNs)) / 1000
    if (ageSeconds > maxAgeSeconds) {
      // Same "Market data is stale" prefix as the 24/5 staleness gate in
      // lib/streams.ts, so the existing log queries match both paths.
      throw new AdapterError({
        statusCode: 503,
        message: `Market data is stale: ${feedId} STALE(age=${ageSeconds.toFixed(
          0,
        )}s>${maxAgeSeconds}s)`,
      })
    }
  }

  // Own properties only: `in` or an undefined check would accept inherited names like "constructor"
  if (!Object.prototype.hasOwnProperty.call(data, resultPath)) {
    throw new AdapterError({
      statusCode: 400,
      message: `resultPath '${resultPath}' not found in data. Available keys: ${Object.keys(
        data,
      ).join(', ')}`,
    })
  }

  return {
    result: scaleDecimals(BigInt(data[resultPath]), data.decimals, decimals).toString(),
    data,
  }
}
