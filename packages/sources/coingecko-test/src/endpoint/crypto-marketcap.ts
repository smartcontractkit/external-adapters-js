import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  cryptoInputParams,
} from '../crypto-utils'

const batchEndpointTransport = new BatchWarmingTransport<CryptoEndpointTypes>({
  prepareRequest: (params, config) => {
    const requestBody = buildBatchedRequestBody(params, config)
    requestBody.params.include_market_cap = true
    return requestBody
  },
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructEntry(res, requestPayload, `${requestPayload.quote.toLowerCase()}_market_cap`),
    ),
})

export const endpoint = new AdapterEndpoint({
  name: 'marketcap',
  aliases: ['crypto-marketcap'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
