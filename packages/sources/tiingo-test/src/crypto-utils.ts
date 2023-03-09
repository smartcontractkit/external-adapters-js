import {
  PriceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from './config'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
} satisfies InputParameters & PriceEndpointInputParameters

export type RouterPriceEndpointParams = PriceEndpointParams

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
  Request: {
    Params: RouterPriceEndpointParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export type HttpTransportTypes = CryptoEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

const chunkArray = <T extends PriceEndpointParams>(params: T[], size = 100): T[][] =>
  params.length > size ? [params.slice(0, size), ...chunkArray(params.slice(size), size)] : [params]

export const buildBatchedRequestBody = <T extends PriceEndpointParams>(
  params: T[],
  settings: typeof config.settings,
  url: string,
) => {
  // Tiingo supports up to 100 tickers in a single request, so we need to slice it to have 100 element chunks
  const chunkedMatrix = chunkArray(params)

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

export const constructEntry = <T extends PriceEndpointParams>(
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
          statusCode: 400,
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
