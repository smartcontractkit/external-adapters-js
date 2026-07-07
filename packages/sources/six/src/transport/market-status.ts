import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import https from 'https'
import { BaseEndpointTypes } from '../endpoint/market-status'

export interface GraphqlRequest {
  query: string
  variables: {
    ids: string[]
  }
}

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
    RequestBody: GraphqlRequest
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        method: 'POST',
        baseURL: config.API_ENDPOINT,
        url: '/web/v2/graphql',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        data: {
          query: marketStatusGraphqlQuery,
          variables: {
            ids: params.map((p) => p.market).sort(),
          },
        },
        httpsAgent: new https.Agent({
          cert: config.PUBLIC_CERT,
          key: config.PRIVATE_KEY,
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

export const marketStatusGraphqlQuery = `
  query MarketBase($ids: [UserInputId!]!) {
    markets(scheme: BC, ids: $ids) {
      referenceData {
        marketBase {
          bc
          marketStatus
        }
      }
    }
  }`.replace(/\s+/g, ' ')

const getMarketStatus = (market: string, statuses: ResponseSchema['data']['markets']) => {
  const status = statuses.find((s) => s.referenceData?.marketBase?.bc?.toString() === market)
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
