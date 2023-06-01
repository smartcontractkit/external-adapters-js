import { priceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import {
  SingleNumberResultResponse,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from './config'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

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

export type CryptoEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export type HttpTransportTypes = CryptoEndpointTypes & {
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
