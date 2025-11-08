import {
  WebsocketTransportGenerics,
  WebSocketUrlConfigFunctionParameters,
} from '@chainlink/external-adapter-framework/transports'
import {
  WebsocketReverseMappingTransport,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, splitArrayIntoChunks } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseCryptoEndpointTypes, inputParameters } from '../endpoint/utils'
export interface ProviderResponseBody {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  priceData: {
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    volumeNotional: number
    fxOpen: number
    fxHigh: number
    fxLow: number
    fxClose: number
    fxVolumeNotional: number
    fxRate: number
    tradesDone: number
  }[]
}

const logger = makeLogger('TiingoTransportUtils')
const URL_SELECTION_CYCLE_LENGTH = 6

export type CryptoHttpTransportTypes = BaseCryptoEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const buildBatchedRequestBody = <T extends typeof inputParameters.validated>(
  params: T[],
  settings: typeof config.settings,
  url: string,
) => {
  // Tiingo supports up to 100 tickers in a single request, so we need to slice it to have 100 element chunks
  const chunkedMatrix = splitArrayIntoChunks(params, 100)

  return chunkedMatrix.map((chunkedParams) => {
    return {
      params: chunkedParams,
      request: {
        baseURL: settings.API_ENDPOINT,
        url,
        params: {
          token: settings.API_KEY,
          tickers: [...new Set(chunkedParams.map((p) => `${p.base}${p.quote}`.toLowerCase()))].join(
            ',',
          ),
          resampleFreq: url === 'tiingo/crypto/prices' ? '24hour' : undefined,
        },
      },
    }
  })
}

export const buildBatchedRequestBodyForPrice = <T extends typeof inputParameters.validated>(
  params: T[],
  settings: typeof config.settings,
  url: string,
) => {
  return params.map((param) => {
    return {
      params: [{ base: param.base, quote: param.quote }],
      request: {
        baseURL: settings.API_ENDPOINT,
        url: url,
        params: {
          token: settings.API_KEY,
          baseCurrency: param.base.toLowerCase(),
          convertCurrency: param.quote.toLowerCase(),
          consolidateBaseCurrency: true,
          resampleFreq: '24hour',
        },
      },
    }
  })
}

export const constructEntry = <T extends typeof inputParameters.validated>(
  res: ProviderResponseBody[],
  params: T[],
  resultPath: 'close' | 'volumeNotional' | 'fxClose',
) => {
  if (!res?.length) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `Tiingo provided no data for ${param.base}/${param.quote}`,
          statusCode: 502,
        },
      }
    })
  }
  return res.map((entry) => {
    return {
      //baseCurrency from response for vwap endpoint has 'cvwap' suffix which needs to be removed
      params: {
        base: entry.baseCurrency.replace('cvwap', ''),
        quote: entry.quoteCurrency,
      },
      response: {
        data: {
          result: entry.priceData[0][resultPath],
        },
        result: entry.priceData[0][resultPath],
      },
    }
  })
}

export const wsMessageContent = (
  eventName: 'subscribe' | 'unsubscribe',
  apiKey: string,
  thresholdLevel: number,
  base: string,
  quote: string,
  skipSlash = false, // needed for forex
) => {
  const ticker = skipSlash ? `${base}${quote}` : `${base}/${quote}`
  return {
    eventName,
    authorization: apiKey,
    eventData: {
      thresholdLevel,
      tickers: [ticker.toLowerCase()],
    },
  }
}

// There exists similar functionality in tiingo-state EA
// urlConfigFunctionParameters.streamHandlerInvocationsWithNoConnection is 1-indexed
export const wsSelectUrl = (
  primaryBaseUrl: string,
  secondaryBaseUrl: string,
  urlSuffix: string,
  urlConfigFunctionParameters: WebSocketUrlConfigFunctionParameters,
): string => {
  // business logic connection attempts (repeats):
  //   5x try connecting to primary url
  //   1x try connection to secondary url
  const primaryUrl = `${primaryBaseUrl}/${urlSuffix}`
  const secondaryUrl = `${secondaryBaseUrl}/${urlSuffix}`

  const zeroIndexedNumAttemptedConnections =
    urlConfigFunctionParameters.streamHandlerInvocationsWithNoConnection - 1
  const cycle = zeroIndexedNumAttemptedConnections % URL_SELECTION_CYCLE_LENGTH
  const url = cycle !== URL_SELECTION_CYCLE_LENGTH - 1 ? primaryUrl : secondaryUrl

  logger.trace(
    `wsSelectUrl: connection attempts ${zeroIndexedNumAttemptedConnections}, url: ${url}`,
  )
  return url
}

export class TiingoWebsocketTransport<
  T extends WebsocketTransportGenerics,
> extends WebSocketTransport<T> {
  apiKey = ''
}

export class TiingoWebsocketReverseMappingTransport<
  T extends WebsocketTransportGenerics,
  K,
> extends WebsocketReverseMappingTransport<T, K> {
  apiKey = ''
}
