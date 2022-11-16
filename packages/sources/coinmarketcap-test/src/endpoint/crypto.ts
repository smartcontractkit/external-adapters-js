import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { buildBatchedRequestBody, CryptoEndpointTypes, inputParameters } from '../crypto-utils'

const batchEndpointTransport = new BatchWarmingTransport<CryptoEndpointTypes>({
  prepareRequest: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (_, res) => {
    return res
  },
})

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['price'],
  transport: batchEndpointTransport,
  inputParameters: inputParameters,
})
