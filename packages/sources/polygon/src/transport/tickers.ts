import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/tickers'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'

const logger = makeLogger('Polygon Tickers Logger')

interface ProviderResponseBody {
  status: string
  tickers: Tickers[]
}

interface Tickers {
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

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
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
