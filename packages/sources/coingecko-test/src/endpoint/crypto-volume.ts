import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildBatchedRequestBody,
  constructEntry,
  CryptoEndpointTypes,
  cryptoInputParams,
} from '../crypto-utils'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

const transport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params, config) => {
    const requestBody = buildBatchedRequestBody(params, config)
    requestBody.request.params.include_24hr_vol = true
    return requestBody
  },
  parseResponse: (params, res) =>
    params.map((requestPayload) =>
      constructEntry(res.data, requestPayload, `${requestPayload.quote.toLowerCase()}_24h_vol`),
    ),
})

export const endpoint = new AdapterEndpoint({
  name: 'volume',
  aliases: ['crypto-volume'],
  transport,
  inputParameters: cryptoInputParams,
})
