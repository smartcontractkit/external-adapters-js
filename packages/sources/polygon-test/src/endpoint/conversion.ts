import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const logger = makeLogger('Polygon conversion')

export const inputParameters = new InputParameters({
  base: {
    aliases: ['from'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    aliases: ['to'],
    required: true,
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
  amount: {
    required: false,
    description: 'The amount of the `base` to convert ',
    default: 1,
    type: 'number',
  },
  precision: {
    required: false,
    description: 'The number of significant figures to include',
    default: 6,
    type: 'number',
  },
})

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export interface ProviderResponseBody {
  converted: number
  from: string
  initialAmount: number
  last: { ask: number; bid: number; exchange: number; timestamp: number }
  request_id: string
  status: string
  symbol: string
  to: string
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      const from = param.base.toUpperCase()
      const to = param.quote.toUpperCase()
      const amount = param.amount
      const precision = param.precision
      const url = `/v1/conversion/${from}/${to}`
      return {
        params: [param],
        request: {
          baseURL: settings.API_ENDPOINT,
          url,
          params: {
            apikey: settings.API_KEY,
            amount,
            precision,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = res.data?.converted
      if (!result) {
        const message = `The data provider didn't return any value for ${JSON.stringify(param)}`
        logger.info(message)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: message,
          },
        }
      }
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
  name: 'conversion',
  transport: httpTransport,
  inputParameters: inputParameters,
})
