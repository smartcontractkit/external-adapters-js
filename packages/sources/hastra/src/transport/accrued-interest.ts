import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/accrued-interest'

export interface ResponseSchema {
  token_name: string
  contract_address: string
  outstanding_interest_accrued: string
  as_of_datetime: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/tokens/interest_accrued/${param.contractAddress}`,
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
            errorMessage: `The data provider didn't return any value for contract '${param.contractAddress}'`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const result = response.data.outstanding_interest_accrued
      return {
        params: param,
        response: {
          result,
          data: {
            result,
            ...response.data,
          },
        },
      }
    })
  },
}

// Exported for testing
export class AccruedInterestHttpTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const httpTransport = new AccruedInterestHttpTransport()
