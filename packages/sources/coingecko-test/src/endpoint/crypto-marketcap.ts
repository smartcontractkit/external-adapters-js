import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  cryptoInputParams,
} from '../crypto-utils'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'

const transport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => {
    const requestBody = buildBatchedRequestBody(params, config)
    requestBody.request.params.include_market_cap = true
    return requestBody
  },
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructEntry(res.data, requestPayload, `${requestPayload.quote.toLowerCase()}_market_cap`),
    ),
})

export const endpoint = new AdapterEndpoint({
  name: 'marketcap',
  aliases: ['crypto-marketcap'],
  transport,
  inputParameters: cryptoInputParams,
  overrides: overrides.coingecko,
})
