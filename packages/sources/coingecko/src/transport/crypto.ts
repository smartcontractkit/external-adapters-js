import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  buildBatchedCryptoRequestBody,
  constructCryptoEntry,
  CryptoHttpTransportTypes,
} from './utils'

export const transport = new HttpTransport<CryptoHttpTransportTypes>({
  prepareRequests: (params, config) => buildBatchedCryptoRequestBody(params, config),
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructCryptoEntry(res.data, requestPayload, requestPayload.quote.toLowerCase()),
    ),
})
