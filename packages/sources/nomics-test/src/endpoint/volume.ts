import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { buildCryptoRequestBody, CryptoEndpointTypes, inputParameters } from '../crypto-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

const restEndpointTransport = new RestTransport<CryptoEndpointTypes>({
  prepareRequest: (req, config) => {
    return buildCryptoRequestBody(config.API_ENDPOINT, config.API_KEY, req.requestContext.data)
  },
  parseResponse: (_, res) => {
    if (!res.data.length) {
      throw new AdapterError({
        message:
          'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides.',
      })
    }
    return {
      data: {
        result: Number(res.data[0]['1d'].volume),
      },
      statusCode: 200,
      result: Number(res.data[0]['1d'].volume),
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint<CryptoEndpointTypes>({
  name: 'volume',
  transport: restEndpointTransport,
  inputParameters,
})
