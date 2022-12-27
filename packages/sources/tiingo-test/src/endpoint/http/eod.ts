import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

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

const inputParameters = {
  ticker: {
    aliases: ['base', 'from', 'coin'],
    required: true,
    type: 'string',
    description: 'The stock ticker to query',
  },
} as const

type EODEndpointTypes = {
  Request: {
    Params: { ticker: string }
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: { token: string }
    ResponseBody: ProviderResponseBody[]
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
    return params.map((entry) => {
      return {
        params: { ticker: entry.ticker },
        response: {
          data: {
            result: res.data[0].close,
          },
          result: res.data[0].close,
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EODEndpointTypes>({
  name: 'eod',
  transport: httpTransport,
  inputParameters: inputParameters,
})
