import { EndpointTypes } from './router'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'

const logger = makeLogger('Polygon Tickers Logger')

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description:
      'The symbol of the currency to query. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/)',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description:
      'The symbol of the currency to convert to. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/)',
    required: true,
  },
} as const

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

// format input as an array regardless of if it is a string or an array already
const formatArray = (input: string | string[]): string[] =>
  typeof input === 'string' ? [input] : input

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const from = param.base.toUpperCase()
      const to = param.quote.toUpperCase()

      const pairArray = []
      for (const fromCurrency of formatArray(from)) {
        for (const toCurrency of formatArray(to)) {
          pairArray.push(`C:${fromCurrency.toUpperCase()}${toCurrency.toUpperCase()}`)
        }
      }

      const pairs = pairArray.toString()
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url: '/v2/snapshot/locale/global/markets/forex/tickers',
        method: 'GET',
        params: {
          apikey: config.API_KEY,
          tickers: pairs,
        },
      }
      return {
        params,
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    if (res.data.tickers.length === 0) {
      logger.error(`The data provider didn't return any value`)
      return []
    }
    return params.map((param) => {
      const result = res.data.tickers[0]['min']['c']
      return {
        params: { ...param },
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
