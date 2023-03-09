import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'

const logger = makeLogger('Finnhub quote endpoint')

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
} as const

export interface ProviderResponseBody {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const commonKeys: Record<string, string> = {
  N225: '^N225',
  FTSE: '^FTSE',
  XAU: 'OANDA:XAU_USD',
  XAG: 'OANDA:XAG_USD',
  AUD: 'OANDA:AUD_USD',
  EUR: 'OANDA:EUR_USD',
  GBP: 'OANDA:GBP_USD',
  // CHF & JPY are not supported
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      let symbol = param.base.toUpperCase()
      if (commonKeys[symbol]) {
        symbol = commonKeys[symbol]
      }

      const requestConfig = {
        baseURL: `${settings.API_ENDPOINT}/quote`,
        method: 'GET',
        params: {
          symbol,
          token: settings.API_KEY,
        },
      }
      return {
        params,
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    const data = res.data
    if (!data) {
      const errorMessage = 'No data found'
      if (errorMessage) {
        logger.warn(errorMessage)
        return [
          {
            params: { base: params[0].base },
            response: {
              statusCode: 502,
              errorMessage,
            },
          },
        ]
      }
    }

    return params.map((param) => {
      const result = data.c
      return {
        params: { ...param },
        response: {
          data: {
            result,
          },
          result,
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'quote',
  aliases: ['common'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
