import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  cryptoInputParams,
} from '../crypto-utils'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

const transport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => buildBatchedRequestBody(params, config),
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructEntry(res.data, requestPayload, requestPayload.quote.toLowerCase()),
    ),
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['crypto-batched', 'batched', 'batch', 'price'],
  transport,
  inputParameters: cryptoInputParams,
})
