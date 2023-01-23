import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'

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
} as const

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
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

const chunkArray = (params: PriceEndpointParams[], size = 100): PriceEndpointParams[][] =>
  params.length > size ? [params.slice(0, size), ...chunkArray(params.slice(size), size)] : [params]

export const buildBatchedRequestBody = (
  params: PriceEndpointParams[],
  config: AdapterConfig<typeof customSettings>,
  url: string,
) => {
  // Tiingo supports up to 100 tickers in a single request, so we need to slice it to have 100 element chunks
  const chunkedMatrix = chunkArray(params)

  return chunkedMatrix.map((chunkedParams) => {
    return {
      params: chunkedParams,
      request: {
        baseURL: config.API_ENDPOINT,
        url,
        params: {
          token: config.API_KEY,
          tickers: [...new Set(chunkedParams.map((p) => `${p.base}${p.quote}`.toLowerCase()))].join(
            ',',
          ),
        },
      },
    }
  })
}

export const constructEntry = (
  res: ProviderResponseBody[],
  params: PriceEndpointParams[],
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
      params: { base: entry.baseCurrency.replace('cvwap', ''), quote: entry.quoteCurrency },
      response: {
        data: {
          result: entry.priceData[0][resultPath],
        },
        result: entry.priceData[0][resultPath],
      },
    }
  })
}
