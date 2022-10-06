import { PRO_API_ENDPOINT, DEFAULT_API_ENDPOINT } from './config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'

type Overrides = Record<string, Record<string, string>>

export interface CryptoRequestParams {
  coinid?: string
  base?: string
  quote: string
}

export const cryptoInputParams: InputParameters = {
  coinid: {
    description: 'The CoinGecko id or to query',
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
}

export interface ProviderRequestBody {
  ids: string
  vs_currencies: string
  include_market_cap?: boolean
  include_24hr_vol?: boolean
}

export interface ProviderResponseBody {
  [base: string]: {
    [quote: string]: number
  }
}

interface ResultEntry {
  value: number
  params: {
    quote: string
    base?: string
    coinid?: string
    overrides?: Overrides
  }
}

interface ResultEntryWithoutOverrides {
  value: number
  params: {
    quote: string
    base?: string
    coinid?: string
  }
}

export const buildBatchedRequestBody = (
  params: CryptoRequestParams[],
  config: AdapterConfig,
): HttpRequestConfig<ProviderRequestBody> => {
  return {
    baseURL: config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT,
    url: '/simple/price',
    method: 'GET',
    params: {
      ids: [...new Set(params.map((p) => p.coinid ?? p.base))].join(','),
      vs_currencies: [...new Set(params.map((p) => p.quote))].join(','),
      x_cg_pro_api_key: config.API_KEY,
    },
  }
}

const logger = makeLogger('CoinGecko Crypto Batched')

export const constructEntry = (
  res: HttpResponse<ProviderResponseBody>,
  requestPayload: CryptoRequestParams,
  resultPath: string,
): ResultEntryWithoutOverrides | undefined => {
  const coinId = requestPayload.coinid ?? (requestPayload.base as string)
  const dataForCoin = res.data[coinId]
  const dataForQuote = dataForCoin ? dataForCoin[resultPath] : undefined
  if (!dataForQuote) {
    logger.warn(`Data for "${requestPayload.quote}" not found for token "${coinId}`)
    return
  }
  const entry = {
    params: requestPayload,
    value: dataForQuote,
  } as ResultEntry
  if (requestPayload.coinid) {
    entry.params.coinid = requestPayload.coinid
  } else {
    entry.params.base = requestPayload.base
  }
  delete entry.params.overrides
  return entry
}
