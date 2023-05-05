import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import overrides from '../../config/overrides.json'
import { constructEntry, HttpTransportTypes, inputParameters } from '../../crypto-utils'

export const httpTransport = new HttpTransport<HttpTransportTypes>({
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

export const endpoint = new PriceEndpoint({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
