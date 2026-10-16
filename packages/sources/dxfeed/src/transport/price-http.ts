import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import quoteEventSymbols from '../config/quoteSymbols.json'
import { BaseEndpointTypes } from '../endpoint/price'

const logger = makeLogger('DxFeed Price Batched')

type ProviderResponseBody = {
  status: string
  Trade: {
    [key: string]: {
      eventSymbol: string
      eventTime: number
      time: number
      timeNanoPart: number
      sequence: number
      exchangeCode: string
      price: number
      change: number
      size: number
      dayVolume: number
      dayTurnover: number
      tickDirection: string
      extendedTradingHours: boolean
    }
  }
  Quote: {
    [key: string]: {
      eventSymbol: string
      eventTime: number
      timeNanoPart: number
      bidTime: number
      bidExchangeCode: string
      bidPrice: number
      bidSize: number
      askTime: number
      askExchangeCode: string
      askPrice: number
      askSize: number
      sequence: number
    }
  }
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export function buildDxFeedHttpTransport(): HttpTransport<HttpTransportTypes> {
  return new HttpTransport<HttpTransportTypes>({
    prepareRequests: (params, config) => {
      const username = config.API_USERNAME
      const password = config.API_PASSWORD

      // One request per symbol: a symbol with no upstream data must not poison
      // the response for the other requested symbols (a comma-joined batch
      // fails as a whole when any single symbol is rejected upstream).
      return params.map((requestPayload) => {
        const requestConfig = {
          baseURL: config.API_ENDPOINT,
          url: '/events.json',
          method: 'GET',
          params: {
            events: 'Trade,Quote',
            symbols: requestPayload.base.toUpperCase(),
          },
          // Surface upstream 4xx/5xx bodies to parseResponse instead of letting
          // axios throw, so the error is cached and served as a 502 result.
          validateStatus: () => true,
        }

        if (username && password) {
          return {
            params: [requestPayload],
            request: { ...requestConfig, auth: { username, password } },
          }
        }
        return {
          params: [requestPayload],
          request: requestConfig,
        }
      })
    },
    parseResponse: (params, res) => {
      // Upstream error mapping: cache a 502 error result per requested symbol,
      // carrying the same `error` envelope a thrown AdapterError produces so
      // cached and request-path error bodies read the same downstream.
      if (res.status >= 400) {
        const errorMessage = `Provider request failed with status ${res.status}: ${JSON.stringify(
          res.data,
        )}`
        logger.warn(errorMessage)
        return params.map((requestPayload) => ({
          params: requestPayload,
          response: {
            statusCode: 502,
            errorMessage,
            error: {
              name: 'Data Provider error',
              message: errorMessage,
            },
          },
        }))
      }
      return params.map((requestPayload) => {
        const entry = {
          params: requestPayload,
        }
        let result: number
        const events = quoteEventSymbols[requestPayload.base as keyof typeof quoteEventSymbols]
          ? 'Quote'
          : 'Trade'
        try {
          if (events === 'Quote') {
            result = res.data[events][requestPayload.base].bidPrice
          } else {
            result = res.data[events][requestPayload.base].price
          }
        } catch (e) {
          const errorMessage = `Dxfeed provided no data for token "${requestPayload.base}"`
          logger.warn(errorMessage)
          return {
            ...entry,
            response: {
              statusCode: 502,
              errorMessage,
            },
          }
        }
        return {
          ...entry,
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
}
