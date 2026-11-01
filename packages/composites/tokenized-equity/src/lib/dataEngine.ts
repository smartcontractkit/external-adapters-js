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

// Report fields that are prices in the report decimals, so they can be scaled
// and multiplied. Allowed values of the resultPath input parameter.
export const priceFields = ['mid', 'bid', 'ask', 'lastTradedPrice'] as const

/**
 * Requests a feed from the data-engine EA and scales the resultPath field from
 * the report decimals to the requested decimals, truncating like the
 * data-engine EA does for its own resultPath (resolveResult).
 */
export const getDataEngineResult = async (param: {
  url: string
  requester: Requester
  targetEndpoint: TargetEndpoint
  feedId: string
  resultPath: string
  decimals: number
}) => {
  const data = await targetEndpoints[param.targetEndpoint](param.feedId, param.url, param.requester)

  // Own properties only: `in` would also accept inherited names like "constructor"
  if (!Object.prototype.hasOwnProperty.call(data, param.resultPath)) {
    throw new AdapterError({
      statusCode: 400,
      message: `resultPath '${param.resultPath}' not found in data. Available keys: ${Object.keys(
        data,
      ).join(', ')}`,
    })
  }

  const value = BigInt(String(data[param.resultPath as keyof DataEngineV11Data]))
  return {
    result: scaleDecimals(value, data.decimals, param.decimals).toString(),
    data,
  }
}
