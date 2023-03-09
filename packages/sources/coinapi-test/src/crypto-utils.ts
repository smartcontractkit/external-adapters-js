import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from './config'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
  },
} as const

export interface RequestParams {
  base: string
  quote: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

const getMappedSymbols = (requestParams: RequestParams[]) => {
  const symbolGroupMap: Record<string, { filter_asset_id: string[]; base: string }> = {}
  requestParams.forEach((param) => {
    const base = param.base.toUpperCase()
    const quote = param.quote.toUpperCase()

    if (!symbolGroupMap[base]) {
      symbolGroupMap[base] = {
        base,
        filter_asset_id: [],
      }
    }

    if (!symbolGroupMap[base].filter_asset_id) {
      symbolGroupMap[base].filter_asset_id = [quote]
    } else {
      symbolGroupMap[base].filter_asset_id.push(quote)
    }
  })

  return symbolGroupMap
}

export const buildBatchedRequestBody = (
  requestParams: RequestParams[],
  settings: typeof config.settings,
) => {
  // Coinapi supports batching only for quote params (filter_asset_id) so we are grouping requestParams by bases meaning we will send N number of requests to DP where the N is number of unique bases
  const groupedSymbols = getMappedSymbols(requestParams)

  return Object.values(groupedSymbols).map((param) => {
    const url = `exchangerate/${param.base}`
    return {
      params: requestParams.filter((p) => p.base === param.base),
      request: {
        baseURL: settings.API_ENDPOINT,
        url,
        params: {
          filter_asset_id: [...new Set(param.filter_asset_id)].join(','),
          apikey: settings.API_KEY,
        },
      },
    }
  })
}
