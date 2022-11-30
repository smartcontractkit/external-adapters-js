import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'
import { DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from './config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('CoinGecko Global Batched')

export const inputParameters: InputParameters = {
  market: {
    aliases: ['to', 'quote'],
    description: 'The ticker of the coin to query',
    required: true,
  },
}

export interface GlobalRequestParams {
  market: string
}

export interface ProviderResponseBody {
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
    updated_at: number
  }
}

export type GlobalEndpointTypes = {
  Request: {
    Params: GlobalRequestParams
  }
  Response: {
    Data: ProviderResponseBody
    Result: number
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const buildGlobalRequestBody = (apiKey?: string): HttpRequestConfig<never> => {
  return {
    baseURL: apiKey ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT,
    url: '/global',
    method: 'GET',
    params: {
      x_cg_pro_api_key: apiKey,
    },
  }
}

export const constructEntry = (
  res: HttpResponse<ProviderResponseBody>,
  requestPayload: GlobalRequestParams,
  resultPath: 'total_market_cap' | 'market_cap_percentage',
): ProviderResult<GlobalEndpointTypes> | undefined => {
  const resultData = res.data.data
  if (!resultData) {
    logger.warn(`Data not found`)
    return
  }

  const totalMarketcapData = resultData[resultPath]
  if (!totalMarketcapData) {
    logger.warn(`Data for "${resultPath}" not found`)
    return
  }

  const result = totalMarketcapData[requestPayload.market.toLowerCase()]
  if (!result) {
    logger.warn(`Data for "${requestPayload.market}" not found`)
    return
  }

  return {
    params: requestPayload,
    response: {
      data: res.data,
      result,
      timestamps: {
        providerIndicatedTime: resultData.updated_at,
      },
    },
  }
}
