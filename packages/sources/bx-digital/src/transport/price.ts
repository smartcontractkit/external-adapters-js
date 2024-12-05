import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/price'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('apy-finance-test allocations')

export interface ResponseSchema {
  securityId: string
  lastModifiedTime: number
  closingPrice: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema[]
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      logger.error('Use custome header')
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          headers: {
            'API-key': config.API_KEY,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            Referer: 'https://example.com',
          },
        },
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const security = response.data.find((r) => r.securityId == param.securityId)
      if (security && !isNaN(Number(security?.closingPrice))) {
        return {
          params: param,
          response: {
            result: Number(security.closingPrice),
            data: {
              result: Number(security.closingPrice),
            },
            timestamps: {
              providerIndicatedTimeUnixMs: security.lastModifiedTime * 1000,
            },
          },
        }
      } else {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.securityId}`,
            statusCode: 502,
          },
        }
      }
    })
  },
})
