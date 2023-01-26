import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { customSettings, getApiEndpoint } from './config'
import {
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'

export interface CryptoRequestParams {
  coinid?: string
  base?: string
  quote: string
}

export const cryptoInputParams = {
  coinid: {
    description: 'The Coingecko id to query',
    type: 'string',
    required: false,
  },
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: false,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
  },
} as const

export interface ProviderResponseBody {
  [base: string]: {
    [quote: string]: number
  }
}

export type CryptoEndpointTypes = {
  Request: {
    Params: CryptoRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const buildBatchedRequestBody = (
  params: CryptoRequestParams[],
  config: AdapterConfig<typeof customSettings>,
) => {
  return {
    params,
    request: {
      baseURL: getApiEndpoint(config),
      url: '/simple/price',
      method: 'GET',
      params: {
        ids: [...new Set(params.map((p) => p.coinid ?? p.base))].join(','),
        vs_currencies: [...new Set(params.map((p) => p.quote))].join(','),
        x_cg_pro_api_key: config.API_KEY,
        precision: 'full',
        include_market_cap: false, // TODO: Drop?
        include_24hr_vol: false, // TODO: Drop?
      },
    },
  }
}

const logger = makeLogger('CoinGecko Crypto Batched')

export const constructEntry = (
  res: ProviderResponseBody,
  requestPayload: CryptoRequestParams,
  resultPath: string,
): ProviderResult<CryptoEndpointTypes> => {
  const coinId = (requestPayload.coinid ?? (requestPayload.base as string)).toLowerCase()
  const dataForCoin = res[coinId]
  const result = dataForCoin ? dataForCoin[resultPath] : undefined
  const entry = {
    params: requestPayload,
  }

  if (!result) {
    let errorMessage = `Coingecko provided no data for token "${coinId}"`
    if (dataForCoin && !result) {
      errorMessage = `Coingecko provided no "${requestPayload.quote}" data for token "${coinId}"`
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
