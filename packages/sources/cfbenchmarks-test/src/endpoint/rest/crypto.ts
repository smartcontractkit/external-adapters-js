import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { EndpointTypes } from '../common/crypto'
import { getIdFromBaseQuote } from '../../utils'

interface PayloadValue {
  value: string
  time: number
}

interface ProviderResponse {
  payload: PayloadValue[]
}

export type RestEndpointTypes = EndpointTypes & {
  Provider: {
    RequestBody: EmptyObject
    ResponseBody: ProviderResponse
  }
}

// NOTE: This is using the BatchWarming transport, but the actual API endpoint is not batchable
export const makeRestTransport = (
  type: 'primary' | 'secondary',
): BatchWarmingTransport<RestEndpointTypes> => {
  return new BatchWarmingTransport<RestEndpointTypes>({
    prepareRequest: (
      [{ base, quote, index }],
      { DEFAULT_API_ENDPOINT, SECONDARY_API_ENDPOINT },
    ) => {
      return {
        baseURL: type === 'primary' ? DEFAULT_API_ENDPOINT : SECONDARY_API_ENDPOINT,
        url: '/v1/values',
        method: 'GET',
        params: {
          id:
            index ||
            // If there is no index set
            // we know that base and quote exist from the extra validation in the routing handler
            // coerce to strings
            getIdFromBaseQuote(base as string, quote as string, type),
        },
      }
    },
    parseResponse: ([{ base, quote }], res) => {
      const values = res.data.payload.sort((a, b) => b.time - a.time) // Descending
      const value = Number(values[0].value)
      return [
        {
          params: { base, quote },
          value,
        },
      ]
    },
  })
}
