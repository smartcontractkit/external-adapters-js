import { generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/twap'

type TwapProviderResponse = {
  result: string
  feedId: string
  windowSeconds: number
  samples: number
  decimals: number
  windowStartTs: number
  windowEndTs: number
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: { feedId: string; windowSeconds: number }
    ResponseBody: TwapProviderResponse
  }
}

export const twapTransportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const fullUrl = `${config.API_ENDPOINT}/api/v1/twap`
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/api/v1/twap',
          method: 'POST',
          headers: {
            ...generateAuthHeaders(config.API_USERNAME, config.API_PASSWORD, 'POST', fullUrl),
            'Content-Type': 'application/json',
          },
          data: {
            feedId: param.feedId,
            windowSeconds: param.windowSeconds,
          },
        },
      }
    })
  },

  parseResponse: (params, response) => {
    return params.map((param) => {
      const data = response.data
      return {
        params: param,
        response: {
          result: data.result,
          data: {
            result: data.result,
            feedId: data.feedId,
            windowSeconds: data.windowSeconds,
            samples: data.samples,
            decimals: data.decimals,
            windowStartTs: data.windowStartTs,
            windowEndTs: data.windowEndTs,
          },
        },
      }
    })
  },
}

export const twapTransport = new HttpTransport<HttpTransportTypes>(twapTransportConfig)
