import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
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
  parseResponse: (params, res) => {
    const entries = [] as ProviderResult<CryptoEndpointTypes>[]
    for (const requestPayload of params) {
      const entry = constructEntry(
        res,
        requestPayload,
        `${requestPayload.quote.toLowerCase()}_market_cap`,
      )
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new AdapterEndpoint({
  name: 'marketcap',
  aliases: ['crypto-marketcap'],
  transport: batchEndpointTransport,
  inputParameters: cryptoInputParams,
})
