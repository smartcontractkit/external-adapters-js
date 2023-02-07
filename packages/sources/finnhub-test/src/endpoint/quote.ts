import { EndpointTypes } from './router'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

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
  prepareRequests: (params, config) => {
    return params.map((param) => {
      let symbol = param.base.toUpperCase()
      if (commonKeys[symbol]) {
        symbol = commonKeys[symbol]
      }

      const requestConfig = {
        baseURL: `${config.API_ENDPOINT}/quote`,
        method: 'GET',
        params: {
          symbol,
          token: config.API_KEY,
        },
      }
      return {
        params,
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = res.data.c
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
