import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildCryptoRequestBody,
  CryptoEndpointTypes,
  inputParameters,
  RequestParams,
} from '../crypto-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

const httpTransport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildCryptoRequestBody(config.API_ENDPOINT, config.API_KEY, params)
  },
  parseResponse: (params, res) => {
    if (!res.data.length) {
      throw new AdapterError({
        message:
          'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides.',
      })
    }

    return res.data.map((response) => {
      const requestParam = params.find((param) => param.base === response.symbol) as RequestParams
      return {
        params: { base: response.symbol, quote: requestParam.quote },
        response: {
          data: {
            result: Number(response.price),
          },
          result: Number(response.price),
        },
      }
    })
  },
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['price'],
  transport: httpTransport,
  inputParameters,
})
