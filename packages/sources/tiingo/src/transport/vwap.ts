import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { constructEntry, CryptoHttpTransportTypes } from './utils'
export const transport = new HttpTransport<CryptoHttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [{ base: param.base, quote: param.quote }],
        request: {
          baseURL: config.API_ENDPOINT,
          url: 'tiingo/crypto/prices',
          params: {
            token: config.API_KEY,
            baseCurrency: `${param.base.toLowerCase()}cvwap`,
            convertCurrency: param.quote.toLowerCase(),
            consolidateBaseCurrency: true,
            resampleFreq: '24hour',
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return constructEntry(res.data, params, 'fxClose')
  },
})
