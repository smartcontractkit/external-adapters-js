import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/crypto-router'

interface PayloadValue {
  value: string
  time: number
}

interface ProviderResponse {
  payload: PayloadValue[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: unknown
    ResponseBody: ProviderResponse
  }
}

export const makeRestTransport = (
  type: 'primary' | 'secondary',
): HttpTransport<HttpTransportTypes> => {
  return new HttpTransport<HttpTransportTypes>({
    prepareRequests: (params, config) => {
      const { API_USERNAME, API_PASSWORD, API_ENDPOINT, SECONDARY_API_ENDPOINT } = config
      const encodedCreds = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')
      return params.map((param) => ({
        params: [param],
        request: {
          baseURL: type === 'primary' ? API_ENDPOINT : SECONDARY_API_ENDPOINT,
          url: '/v1/values',
          headers: {
            Authorization: `Basic ${encodedCreds}`,
          },
          params: {
            id: param.index,
          },
        },
      }))
    },
    parseResponse: (params, res) => {
      const values = res.data.payload.sort((a, b) => b.time - a.time) // Descending
      const value = Number(values[0].value)
      return params.map((param) => ({
        params: param,
        response: {
          result: value,
          data: {
            result: value,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: values[0].time,
          },
        },
      }))
    },
  })
}
