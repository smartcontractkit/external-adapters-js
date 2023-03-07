import { EndpointTypes } from './router'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { adapterConfig } from '../config'

const logger = makeLogger('Finnhub quote endpoint')

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
  prepareRequests: (params) => {
    adapterConfig.initialize()
    adapterConfig.validate()

    return params.map((param) => {
      let symbol = param.base.toUpperCase()
      if (commonKeys[symbol]) {
        symbol = commonKeys[symbol]
      }

      const requestConfig = {
        baseURL: `${adapterConfig.settings.API_ENDPOINT}/quote`,
        method: 'GET',
        params: {
          symbol,
          token: adapterConfig.settings.API_KEY,
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
