import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/address'
import { SolvBtcResponseSchema, prepareSolvBtcRequest, parseSolvBtcResponse } from './solvBTC'
import {
  BedrockUniBtcResponseSchema,
  prepareBedrockUniBtcRequest,
  parseBedrockUniBtcResponse,
} from './bedrockUniBTC'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: SolvBtcResponseSchema & BedrockUniBtcResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      switch (param.client) {
        case 'SolvBTC': {
          return prepareSolvBtcRequest(param, config)
        }
        case 'Bedrock uniBTC': {
          return prepareBedrockUniBtcRequest(param, config)
        }
      }
    })
  },
  parseResponse: (params, response) => {
    if (!response.data) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `The data provider didn't return any value for ${param.client}`,
            statusCode: 502,
          },
        }
      })
    }
    return params.map((param) => {
      switch (param.client) {
        case 'SolvBTC': {
          return parseSolvBtcResponse(param, response.data)
        }
        case 'Bedrock uniBTC': {
          return parseBedrockUniBtcResponse(param, response.data)
        }
      }
    })
  },
})
