import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, getApiEndpoint, getApiHeaders } from '../config'
import overrides from '../config/overrides.json'

export const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    required: false,
    type: 'string',
  },
  resultPath: {
    description: 'The path to the result within the asset quote in the provider response',
    required: false,
    type: 'string',
    options: ['price', 'volume_24h', 'market_cap'],
  },
})

interface CoinInfo {
  price: number
  volume_24h: number
  volume_24h_change_24h: number
  market_cap: number
  market_cap_change_24h: number
  percent_change_15m: number
  percent_change_30m: number
  percent_change_1h: number
  percent_change_6h: number
  percent_change_12h: number
  percent_change_24h: number
  percent_change_7d: number
  percent_change_30d: number
  percent_change_1y: number
  ath_price: number
  percent_from_price_ath: number
}

export interface CryptoResponseSchema {
  id: string
  name: string
  symbol: string
  rank: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  beta_value: number
  first_data_at: string
  last_updated: string
  quotes: {
    [key: string]: CoinInfo
  }
  cost?: number
}

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: CryptoResponseSchema[]
  }
}

// Maps the input parameter value with the value that will be set in the requestContext.data object
const resultPathMap = {
  price: 'price',
  crypto: 'price',
  volume: 'volume_24h',
  marketcap: 'market_cap',
} as const

const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, settings) => {
    // Group requests by quote. The coinpaprika endpoint accepts multiple quotes, but if one of them is invalid
    // the entire request will fail and we would potentially request more pairs than needed, so it's better to
    // simply batch the bases only.
    const paramsByQuote: Record<string, (typeof inputParameters.validated)[]> = {}
    for (const param of params) {
      if (!paramsByQuote[param.quote]) {
        paramsByQuote[param.quote] = []
      }

      paramsByQuote[param.quote].push(param)
    }

    // The tickers endpoint will return _every_ possible base for the asked quotes, no need to specify them anywhere
    return Object.entries(paramsByQuote).map(([quote, params]) => ({
      params,
      request: {
        baseURL: getApiEndpoint(settings),
        url: 'v1/tickers',
        method: 'GET',
        headers: getApiHeaders(settings),
        params: {
          quotes: quote,
        },
      },
    }))
  },
  parseResponse: (params, res) => {
    // Build a map for faster lookups. Because requests to the EA can either have a symbol or the ID, we have to build both.
    // Ideally this inefficiency is fixed in the future by always requiring the ID in the input parameters.
    const resultsBySymbol: Record<string, CryptoResponseSchema> = {}
    const resultsById: Record<string, CryptoResponseSchema> = {}
    for (const result of res.data) {
      resultsById[result.id] = result
      resultsBySymbol[result.symbol] = result
    }

    // Now we can build responses using the maps
    return params.map((p) => {
      // If we have an id specified in the request, we use that to find the information
      // If not, we check if the base was overriden to an id, and finally we check if the base is a symbol
      const data = p.coinid ? resultsById[p.coinid] : resultsById[p.base] || resultsBySymbol[p.base]
      if (!data) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Data for ${p.coinid ? 'id' : 'symbol'} "${
              p.coinid || p.base
            }" was not found in provider response for request: ${JSON.stringify(p)}`,
          },
        }
      }

      const dataForQuote = data.quotes[p.quote]
      if (!dataForQuote) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Data for quote "${
              p.quote
            }" was not found in provider response for request: ${JSON.stringify(p)}`,
          },
        }
      }

      // We always set a value for the resultPath in the request transform
      const resultPath =
        p.resultPath as (typeof inputParameters.definition.resultPath.options)[number]
      const valueRequested = dataForQuote[resultPath]
      if (valueRequested == null) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Value for "${
              p.resultPath
            }" was not found in the quote request: ${JSON.stringify(p)}`,
          },
        }
      }

      return {
        params: p,
        response: {
          result: valueRequested,
          data: {
            result: valueRequested,
          },
        },
      }
    })
  },
})

export const endpoint = new CryptoPriceEndpoint<EndpointTypes>({
  name: 'crypto',
  aliases: ['price', 'marketcap', 'volume'],
  requestTransforms: [
    (request) => {
      if (!request.requestContext.data.resultPath) {
        const endpoint =
          (request.body.data as { endpoint: keyof typeof resultPathMap }).endpoint ||
          request.requestContext.endpointName
        request.requestContext.data.resultPath = resultPathMap[endpoint]
      }
    },
  ],
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.coinpaprika,
})
