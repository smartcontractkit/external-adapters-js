import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../../config'
import overrides from '../../config/overrides.json'

interface ProviderResponseBody {
  adjClose: number
  adjHigh: number
  adjLow: number
  adjOpen: number
  adjVolume: number
  close: number
  date: string
  divCash: number
  high: number
  low: number
  open: number
  splitFactor: number
  volume: number
}

interface ErrorResponse {
  detail: string
}

const inputParameters = new InputParameters({
  ticker: {
    aliases: ['base', 'from', 'coin'],
    required: true,
    type: 'string',
    description: 'The stock ticker to query',
  },
})

type EODEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[] | ErrorResponse
  }
}

export const httpTransport = new HttpTransport<EODEndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `tiingo/daily/${param.ticker.toLowerCase()}/prices`,
          params: { token: config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if ((res.data as ErrorResponse).detail) {
      return [
        {
          params: params[0],
          response: {
            errorMessage: (res.data as ErrorResponse).detail,
            statusCode: 400,
          },
        },
      ]
    }

    return params.map((entry) => {
      const result = (res.data as ProviderResponseBody[])[0]?.close
      if (!result) {
        return {
          params: { ticker: entry.ticker },
          response: {
            errorMessage: `Could not retrieve valid data from Data Provider for ticket ${entry.ticker}. This is likely an issue with the Data Provider or the input params/overrides`,
            statusCode: 400,
          },
        }
      }

      return {
        params: { ticker: entry.ticker },
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

export const endpoint = new AdapterEndpoint<EODEndpointTypes>({
  name: 'eod',
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
