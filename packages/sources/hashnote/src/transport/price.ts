import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AxiosResponse } from 'axios'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'

export interface PriceReport {
  roundId: string
  principal: string
  interest: string
  balance: string
  price: string
  nextPrice: string
  totalSupply: string
  decimals: number
  fee: string
  timestamp: string
  txhash: string
}

export interface ResponseSchema {
  entity: string
  data: PriceReport[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export type RequestParams = typeof inputParameters.validated

export type Config = BaseEndpointTypes['Settings']

const getApiUrl = (param: RequestParams, config: Config) => {
  const token = param.token.toLowerCase()
  switch (token) {
    case 'usyc':
      return config.USYC_API_ENDPOINT
    default:
      throw new Error(`Unsupported token: ${token}`)
  }
}

const getNewestPriceReport = (reports: PriceReport[]): PriceReport => {
  if (reports.length === 0) {
    throw new Error('No price reports available')
  }
  let newestReport = reports[0]
  let newestTimestamp = Number(newestReport.timestamp)
  for (const report of reports) {
    const timestamp = Number(report.timestamp)
    if (timestamp > newestTimestamp) {
      newestReport = report
      newestTimestamp = timestamp
    }
  }
  return newestReport
}

// Exported for testing
export const prepareRequests = (params: RequestParams[], config: Config) => {
  return params.map((param) => {
    const baseURL = getApiUrl(param, config)
    return {
      params: [param],
      request: {
        baseURL,
      },
    }
  })
}

// Exported for testing
export const parseResponse = (params: RequestParams[], response: AxiosResponse<ResponseSchema>) => {
  if (!response.data) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `The data provider didn't return any value for ${param.token}`,
          statusCode: 502,
        },
      }
    })
  }

  return params.map((param) => {
    const result = getNewestPriceReport(response.data.data).price
    return {
      params: param,
      response: {
        result,
        data: {
          result,
        },
      },
    }
  })
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests,
  parseResponse,
})
