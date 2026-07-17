import { generateAuthHeaders } from '@chainlink/data-streams-sdk'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/twap'

type TwapProviderResponse = {
  result: string
  feedId: string
  samples: number
  decimals: number
  windowStartTs: number
  windowEndTs: number
  effectiveWindowStartTs: number
  effectiveWindowEndTs: number
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: { feedId: string; windowSeconds: number; endTs?: number }
    ResponseBody: TwapProviderResponse
  }
}

export const twapTransportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const fullUrl = `${config.API_ENDPOINT}/api/v1/twap`
      const bodyObj: { feedId: string; windowSeconds: number; endTs?: number } = {
        feedId: param.feedId,
        windowSeconds: param.windowSeconds,
      }
      if (param.endTs !== undefined) bodyObj.endTs = param.endTs
      const body = JSON.stringify(bodyObj)
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/api/v1/twap',
          method: 'POST',
          headers: {
            ...generateAuthHeaders(config.API_USERNAME, config.API_PASSWORD, 'POST', fullUrl, body),
            'Content-Type': 'application/json',
          },
          data: bodyObj,
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
            samples: data.samples,
            decimals: data.decimals,
            windowStartTs: data.windowStartTs,
            windowEndTs: data.windowEndTs,
            effectiveWindowStartTs: data.effectiveWindowStartTs,
            effectiveWindowEndTs: data.effectiveWindowEndTs,
          },
        },
      }
    })
  },
}

export const twapTransport = new HttpTransport<HttpTransportTypes>(twapTransportConfig)
