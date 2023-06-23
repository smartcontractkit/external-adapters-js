import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import {
  buildBatchedCryptoRequestBody,
  constructCryptoEntry,
  CryptoHttpTransportTypes,
} from './utils'

export const transport = new HttpTransport<CryptoHttpTransportTypes>({
  prepareRequests: (params, config) => {
    const requestBody = buildBatchedCryptoRequestBody(params, config)
    requestBody.request.params.include_24hr_vol = true
    return requestBody
  },
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructCryptoEntry(
        res.data,
        requestPayload,
        `${requestPayload.quote.toLowerCase()}_24h_vol`,
      ),
    ),
})
