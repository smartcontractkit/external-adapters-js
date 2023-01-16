import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'
import { EndpointTypes } from '../common/crypto'

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
): HttpTransport<RestEndpointTypes> => {
  return new HttpTransport<RestEndpointTypes>({
    prepareRequests: (params, config) => {
      const [{ index }] = params
      const { API_USERNAME, API_PASSWORD, API_ENDPOINT, SECONDARY_API_ENDPOINT } = config
      const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
      return {
        params,
        request: {
          baseURL: type === 'primary' ? API_ENDPOINT : SECONDARY_API_ENDPOINT,
          url: '/v1/values',
          headers: {
            Authorization: `Basic ${encodedCreds}`,
          },
          params: {
            id: index,
          },
        },
      }
    },
    parseResponse: ([{ index }], res) => {
      const values = res.data.payload.sort((a, b) => b.time - a.time) // Descending
      const value = Number(values[0].value)
      return [
        {
          params: { index },
          response: {
            result: value,
            data: {
              result: value,
            },
            timestamps: {
              providerIndicatedTime: values[0].time,
            },
          },
        },
      ]
    },
  })
}
