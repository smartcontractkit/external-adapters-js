import { BaseEndpointTypes, cryptoInputParameters } from '../endpoint/utils'
import {
  HttpTransport,
  WebsocketReverseMappingTransport,
} from '@chainlink/external-adapter-framework/transports'
import { getApiEndpoint, getApiHeaders } from '../config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'

const logger = makeLogger('CoinPaprika')

type WsMessage = {
  id: string
  sym: string
  ts: number
  quotes: {
    [key: string]: {
      m: number
      p: number
      v24h: number
    }
  }
}

type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

// Factory function that returns WebsocketReverseMappingTransport with provided resultPath as a default option
export const buildWebsocketTransport = (resultPath: keyof WsMessage['quotes']['quote']) => {
  const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
    new WebsocketReverseMappingTransport<WsTransportTypes, string>({
      url: (context) => context.adapterSettings.WS_API_ENDPOINT,
      handlers: {
        message(message: WsMessage) {
          const quote = Object.keys(message.quotes)[0]
          const reverseMapKey = `${message.id ?? message.sym}_${quote}`.toUpperCase()
          const pair: typeof cryptoInputParameters.validated | undefined =
            wsTransport.getReverseMapping(reverseMapKey)
          if (!pair) {
            logger.warn(`Pair doesn't exist for key - ${reverseMapKey}`)
            return
          }
          const providerTime = message.ts * 1000
          const dataForQuote = message.quotes[quote]
          if (!dataForQuote) {
            logger.warn(
              `Data for quote "${
                pair.quote
              }" was not found in provider response for the request: ${JSON.stringify(pair)}`,
            )
            return
          }

          const valueRequested = dataForQuote[resultPath]
          return [
            {
              params: pair,
              response: {
                result: valueRequested,
                data: {
                  result: valueRequested,
                },
                timestamps: {
                  providerIndicatedTimeUnixMs: new Date(providerTime).getTime(),
                },
              },
            },
          ]
        },
      },
      builders: {
        subscribeMessage: (params) => {
          const reverseMapKey = `${params.coinid ?? params.base}_${params.quote}`.toUpperCase()
          wsTransport.setReverseMapping(reverseMapKey, params)
          return {
            event: 'subscribe',
            ids: [params.coinid ?? params.base],
            quotes: [params.quote.toUpperCase()],
          }
        },
        unsubscribeMessage: (params) => ({
          event: 'unsubscribe',
          ids: [params.coinid ?? params.base],
        }),
      },
    })

  return wsTransport
}

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

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: CryptoResponseSchema[]
  }
}

// Factory function that returns httpTransport with provided resultPath as a default option
export const buildCryptoHttpTransport = (
  resultPath: (typeof cryptoInputParameters.definition.resultPath.options)[number],
) =>
  new HttpTransport<HttpTransportTypes>({
    prepareRequests: (params, settings) => {
      // Group requests by quote. The coinpaprika endpoint accepts multiple quotes, but if one of them is invalid
      // the entire request will fail and we would potentially request more pairs than needed, so it's better to
      // simply batch the bases only.
      const paramsByQuote: Record<string, (typeof cryptoInputParameters.validated)[]> = {}
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
        const data = p.coinid
          ? resultsById[p.coinid]
          : resultsById[p.base] || resultsBySymbol[p.base]
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

        const resPath = p.resultPath || resultPath
        const valueRequested = dataForQuote[resPath]
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
