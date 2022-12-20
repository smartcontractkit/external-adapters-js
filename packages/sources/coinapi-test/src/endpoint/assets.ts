import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { customSettings } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of the currency to query',
    required: true,
  },
} as const

export interface RequestParams {
  base: string
}

export interface ProviderResponseBody {
  asset_id: string
  name: string
  type_is_crypto: number
  data_start: string
  data_end: string
  data_quote_start: string
  data_quote_end: string
  data_orderbook_start: string
  data_orderbook_end: string
  data_trade_start: string
  data_trade_end: string
  data_symbols_count: number
  volume_1hrs_usd: number
  volume_1day_usd: number
  volume_1mth_usd: number
  price_usd: number
  id_icon: string
}

export interface ProviderRequestBody {
  filter_asset_id: string
  apikey: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ProviderResponseBody[]
  }
}

const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: 'assets',
        params: {
          apikey: config.API_KEY,
          filter_asset_id: params.map((p) => p.base).join(','),
        },
      },
    }
  },

  parseResponse: (params, res) => {
    if (!res.data?.length) {
      return params.map((param) => {
        return {
          params: { ...param },
          response: {
            errorMessage: `Coinapi provided no price data for token ${param.base}`,
            statusCode: 400,
          },
        }
      })
    }
    return res.data.map((entry) => {
      return {
        params: { base: entry.asset_id },
        response: {
          data: {
            result: entry.price_usd,
          },
          result: entry.price_usd,
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'assets',
  transport: httpTransport,
  inputParameters,
})
