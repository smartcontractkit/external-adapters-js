import { getDeutscheBoersePrice } from '@chainlink/data-engine-adapter'
// Type-only: data-engine src files are not available at runtime
import type { BaseEndpointTypes as DeutscheBoerseV11Types } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { scaleDecimals } from './decimals'

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
}: {
  url: string
  requester: Requester
  targetEndpoint: TargetEndpoint
  feedId: string
  resultPath: PriceField
  decimals: number
}) => {
  const data = await targetEndpoints[targetEndpoint](feedId, url, requester)

  // Own properties only: `in` or an undefined check would accept inherited names like "constructor"
  if (!Object.prototype.hasOwnProperty.call(data, resultPath)) {
    throw new AdapterError({
      statusCode: 400,
      message: `resultPath '${resultPath}' not found in data. Available keys: ${Object.keys(
        data,
      ).join(', ')}`,
    })
  }

  // A report value that is not a positive integer, e.g. "" or "0", would
  // otherwise scale to a price of 0, and null or a fraction fail in BigInt
  const price = data[resultPath]
  if (typeof price !== 'string' || !/^\d+$/.test(price) || BigInt(price) === 0n) {
    throw new AdapterError({
      statusCode: 502,
      message: `Invalid ${resultPath} ${JSON.stringify(
        price,
      )} in data engine report for feedId '${feedId}'`,
    })
  }

  if (!Number.isInteger(data.decimals) || data.decimals < 0) {
    throw new AdapterError({
      statusCode: 502,
      message: `Invalid decimals ${JSON.stringify(
        data.decimals,
      )} in data engine report for feedId '${feedId}'`,
    })
  }

  return {
    result: scaleDecimals(BigInt(price), data.decimals, decimals).toString(),
    data,
  }
}
