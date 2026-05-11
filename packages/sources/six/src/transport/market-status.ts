import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import https from 'https'
import { BaseEndpointTypes } from '../endpoint/market-status'

export interface ResponseSchema {
  data: {
    markets: {
      referenceData: {
        marketBase: {
          bc: number | string
          marketStatus: string
        }
      }
    }[]
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: '/web/v2/markets/referenceData/marketBase',
        headers: { accept: 'application/json' },
        params: {
          scheme: 'BC',
          ids: params
            .map((p) => p.market)
            .sort()
            .join(','),
        },
        httpsAgent: new https.Agent({
          cert: config.PUBLIC_CERT.replace(/\\n/g, '\n'),
          key: config.PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      },
    }
  },
  parseResponse: (params, response) => {
    if (!response.data?.data?.markets) {
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `The data provider didn't return any value for ${param.market}`,
          statusCode: 502,
        },
      }))
    }

    return params.map((param) => {
      const result = getMarketStatus(param.market, response.data.data.markets)
      return {
        params: param,
        response: {
          result: result.result,
          data: result,
        },
      }
    })
  },
})

const getMarketStatus = (market: string, statuses: ResponseSchema['data']['markets']) => {
  const status = statuses.find((s) => s.referenceData?.marketBase?.bc == market)
  const marketStatus = status?.referenceData?.marketBase?.marketStatus

  let result = MarketStatus.UNKNOWN
  if (marketStatus === 'ACTIVE') {
    result = MarketStatus.OPEN
  } else if (marketStatus === 'INACTIVE') {
    result = MarketStatus.CLOSED
  }

  return {
    result,
    statusString: MarketStatus[result],
  }
}
