import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { EndpointTypes, getIdFromBaseQuote } from '../common/crypto'

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
export const transport = new BatchWarmingTransport<RestEndpointTypes>({
  prepareRequest: ([{ base, quote }], { DEFAULT_API_ENDPOINT }) => {
    return {
      baseURL: DEFAULT_API_ENDPOINT,
      url: '/v1/values',
      method: 'GET',
      params: {
        id: getIdFromBaseQuote(base, quote, 'primary'),
      },
    }
  },
  parseResponse: ([{ base, quote }], res) => {
    const values = res.data.payload.sort((a, b) => {
      if (a.time < b.time) return 1
      if (a.time > b.time) return -1
      return 0
    })
    const value = Number(values[0].value)
    return [
      {
        params: { base, quote },
        value,
      },
    ]
  },
})

export const transportSecondary = new BatchWarmingTransport<RestEndpointTypes>({
  prepareRequest: ([{ base, quote }], { SECONDARY_API_ENDPOINT }) => {
    return {
      baseURL: SECONDARY_API_ENDPOINT,
      url: '/v1/values',
      method: 'GET',
      params: {
        id: getIdFromBaseQuote(base, quote, 'secondary'),
      },
    }
  },
  parseResponse: ([{ base, quote }], res) => {
    const values = res.data.payload.sort((a, b) => {
      if (a.time < b.time) return 1
      if (a.time > b.time) return -1
      return 0
    })
    const value = Number(values[0].value)
    return [
      {
        params: { base, quote },
        value,
      },
    ]
  },
})
