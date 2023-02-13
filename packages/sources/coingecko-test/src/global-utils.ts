import { customSettings, getApiEndpoint } from './config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import {
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { ProviderRequestConfig } from '@chainlink/external-adapter-framework/transports'

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
    updated_at: number // UNIX timestamp in seconds
  }
}

export type GlobalEndpointTypes = {
  Request: {
    Params: GlobalRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const buildGlobalRequestBody = (
  params: GlobalRequestParams[],
  config: AdapterConfig<typeof customSettings>,
): ProviderRequestConfig<GlobalEndpointTypes> => {
  return {
    params,
    request: {
      baseURL: getApiEndpoint(config),
      url: '/global',
      method: 'GET',
      params: {
        x_cg_pro_api_key: config.API_KEY,
      },
    },
  }
}

export const constructEntry = (
  res: ProviderResponseBody,
  requestPayload: GlobalRequestParams,
  resultPath: 'total_market_cap' | 'market_cap_percentage',
): ProviderResult<GlobalEndpointTypes> => {
  const entry = {
    params: requestPayload,
  }

  const resultData = res.data
  if (!resultData) {
    const errorMessage = 'No data found'
    logger.warn(errorMessage)
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
    logger.warn(errorMessage)
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
