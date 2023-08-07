import { config, getApiEndpoint } from '../config'
import {
  BaseCryptoEndpointTypes,
  BaseGlobalEndpointTypes,
  cryptoInputParams,
  globalInputParameters,
} from '../endpoint/utils'
import { ProviderRequestConfig } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'

// Crypto endpoints utils
export interface ProviderResponseBody {
  [base: string]: {
    [quote: string]: number
  }
}

export type CryptoHttpTransportTypes = BaseCryptoEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}
export const buildBatchedCryptoRequestBody = (
  params: (typeof cryptoInputParams.validated)[],
  settings: typeof config.settings,
): ProviderRequestConfig<CryptoHttpTransportTypes> => {
  return {
    params,
    request: {
      baseURL: getApiEndpoint(settings),
      url: '/simple/price',
      method: 'GET',
      params: {
        ids: [...new Set(params.map((p) => p.coinid ?? p.base))].join(','),
        vs_currencies: [...new Set(params.map((p) => p.quote))].join(','),
        x_cg_pro_api_key: settings.API_KEY,
        precision: 'full',
      },
    },
  }
}

const logger = makeLogger('CoinGecko Crypto Batched')

export const constructCryptoEntry = (
  res: ProviderResponseBody,
  requestPayload: typeof cryptoInputParams.validated,
  resultPath: string,
): ProviderResult<CryptoHttpTransportTypes> => {
  const coinId = (requestPayload.coinid ?? (requestPayload.base as string)).toLowerCase()
  const dataForCoin = res[coinId]
  const result = dataForCoin ? dataForCoin[resultPath] : undefined
  const entry = {
    params: requestPayload,
  }

  if (!result) {
    let errorMessage = `Coingecko provided no data for token "${coinId}"`
    if (dataForCoin && !result) {
      errorMessage = `Coingecko provided no "${resultPath}" data for token "${coinId}"`
    }
    logger.warn(errorMessage)
    return {
      ...entry,
      response: {
        statusCode: 502,
        errorMessage,
      },
    }
  }

  if (requestPayload.coinid) {
    entry.params.coinid = requestPayload.coinid
  } else {
    entry.params.base = requestPayload.base
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
}

// Global endpoints utils
export interface GlobalProviderResponseBody {
  data: {
    active_cryptocurrencies: number
    upcoming_icos: number
    ongoing_icos: number
    ended_icos: number
    markets: number
    total_market_cap: Record<string, number>
    total_volume: Record<string, number>
    market_cap_percentage: Record<string, number>
    market_cap_change_percentage_24h_usd: number
    updated_at: number // UNIX timestamp in seconds
  }
}

export type GlobalHttpTransportTypes = BaseGlobalEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: GlobalProviderResponseBody
  }
}

const globalLogger = makeLogger('CoinGecko Global Batched')

export const buildGlobalRequestBody = (
  params: (typeof globalInputParameters.validated)[],
  settings: typeof config.settings,
): ProviderRequestConfig<GlobalHttpTransportTypes> => {
  return {
    params,
    request: {
      baseURL: getApiEndpoint(settings),
      url: '/global',
      method: 'GET',
      params: {
        x_cg_pro_api_key: settings.API_KEY,
      },
    },
  }
}

export const constructGlobalEntry = (
  res: GlobalProviderResponseBody,
  requestPayload: typeof globalInputParameters.validated,
  resultPath: 'total_market_cap' | 'market_cap_percentage',
): ProviderResult<GlobalHttpTransportTypes> => {
  const entry = {
    params: requestPayload,
  }

  const resultData = res.data
  if (!resultData) {
    const errorMessage = 'No data found'
    globalLogger.warn(errorMessage)
    return {
      ...entry,
      response: {
        statusCode: 502,
        errorMessage,
      },
    }
  }

  const totalMarketcapData = resultData[resultPath]
  if (!totalMarketcapData) {
    const errorMessage = `Data for "${resultPath}" not found`
    globalLogger.warn(errorMessage)
    return {
      ...entry,
      response: {
        statusCode: 502,
        errorMessage,
      },
    }
  }

  const result = totalMarketcapData[requestPayload.market.toLowerCase()]
  if (!result) {
    const errorMessage = `Data for "${requestPayload.market}" not found`
    globalLogger.warn(errorMessage)
    return {
      ...entry,
      response: {
        statusCode: 502,
        errorMessage,
      },
    }
  }

  return {
    params: requestPayload,
    response: {
      data: { result },
      result,
      timestamps: {
        providerIndicatedTimeUnixMs: resultData.updated_at * 1000,
      },
    },
  }
}
