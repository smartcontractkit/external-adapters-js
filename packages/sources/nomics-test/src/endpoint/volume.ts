import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildCryptoRequestBody,
  CryptoEndpointTypes,
  inputParameters,
  RequestParams,
} from '../crypto-utils'

const httpTransport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildCryptoRequestBody(config.API_ENDPOINT, config.API_KEY, params)
  },
  parseResponse: (params, res) => {
    if (!res.data.length) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            statusCode: 400,
            errorMessage:
              'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
          },
        }
      })
    }

    return res.data.map((response) => {
      const requestParam = params.find((param) => param.base === response.symbol) as RequestParams
      return {
        params: { base: response.symbol, quote: requestParam.quote },
        response: {
          data: {
            result: Number(response['1d'].volume),
          },
          result: Number(response['1d'].volume),
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<CryptoEndpointTypes>({
  name: 'volume',
  transport: httpTransport,
  inputParameters,
})
