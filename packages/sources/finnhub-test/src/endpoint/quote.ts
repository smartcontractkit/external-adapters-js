import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'

const logger = makeLogger('Finnhub quote endpoint')

export const inputParameters = new InputParameters({
  base: {
    aliases: ['quote', 'asset', 'from'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
})

export interface ProviderResponseBody {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      const symbol = param.base.toUpperCase()
      const requestConfig = {
        baseURL: `${settings.API_ENDPOINT}/quote`,
        method: 'GET',
        params: {
          symbol,
          token: settings.API_KEY,
        },
      }
      return {
        params: [param],
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    const data = res.data
    if (!data.c) {
      return params.map((param) => {
        const errorMessage = `No data found for ${param.base}`
        logger.info(errorMessage)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      })
    }

    return params.map((param) => {
      const result = data.c
      return {
        params: param,
        response: {
          data: {
            result,
          },
          result,
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'quote',
  aliases: ['common'],
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.finnhub,
})
