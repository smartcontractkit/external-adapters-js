import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const logger = makeLogger('Polygon Tickers Logger')
export const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
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
  status: string
  tickers: Tickers[]
}

export interface Tickers {
  day: {
    c: number
    h: number
    l: number
    o: number
    v: number
  }
  lastQuote: {
    a: number
    b: number
    t: number
    x: number
  }
  min: {
    c: number
    h: number
    l: number
    o: number
    v: number
  }
  prevDay: {
    c: number
    h: number
    l: number
    o: number
    v: number
    vw: number
  }
  ticker: string
  todaysChange: number
  todaysChangePerc: number
  updated: number
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return {
      params,
      request: {
        baseURL: settings.API_ENDPOINT,
        url: '/v2/snapshot/locale/global/markets/forex/tickers',
        method: 'GET',
        params: {
          apikey: settings.API_KEY,
          tickers: [...new Set(params.map((p) => `C:${p.base}${p.quote}`.toUpperCase()))].join(','),
        },
      },
    }
  },
  parseResponse: (params, res) => {
    if (res.data.tickers.length === 0) {
      logger.info(`Data provider returned empty response`)
      return params.map((param) => {
        return {
          params: param,
          response: {
            errorMessage: `Data was not found in response for request: ${JSON.stringify(param)},`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const ticker = `C:${param.base}${param.quote}`.toUpperCase()
      const tickerResponse = res.data.tickers.find((t) => t.ticker === ticker)
      if (!tickerResponse) {
        const message = `Data was not found in response for request: ${JSON.stringify(param)}`
        logger.info(message)
        return {
          params: param,
          response: {
            errorMessage: message,
            statusCode: 502,
          },
        }
      }
      const result = tickerResponse.min.c
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
  name: 'tickers',
  aliases: ['forex', 'price'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
