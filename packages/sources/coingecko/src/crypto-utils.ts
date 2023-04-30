import { ProviderRequestConfig } from '@chainlink/external-adapter-framework/transports'
import {
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, getApiEndpoint } from './config'

export const cryptoInputParams = new InputParameters({
  coinid: {
    description: 'The Coingecko id to query',
    type: 'string',
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
})

export interface ProviderResponseBody {
  [base: string]: {
    [quote: string]: number
  }
}

export type CryptoEndpointTypes = {
  Parameters: typeof cryptoInputParams.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const buildBatchedRequestBody = (
  params: (typeof cryptoInputParams.validated)[],
  settings: typeof config.settings,
): ProviderRequestConfig<CryptoEndpointTypes> => {
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

export const constructEntry = (
  res: ProviderResponseBody,
  requestPayload: typeof cryptoInputParams.validated,
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
