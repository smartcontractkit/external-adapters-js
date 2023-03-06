import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { constructEntry, CryptoEndpointTypes, inputParameters } from '../../crypto-utils'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../../config/overrides.json'

export const httpTransport = new HttpTransport<CryptoEndpointTypes>({
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

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
