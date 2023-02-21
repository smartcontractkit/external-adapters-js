import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  buildBatchedRequestBody,
  constructEntries,
  inputParameters,
  StockEndpointTypes,
} from '../stock-utils'

export const httpTransport = new HttpTransport<StockEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    return constructEntries(res.data, params, 'close')
  },
})

export const endpoint = new AdapterEndpoint<StockEndpointTypes>({
  name: 'eod',
  aliases: ['eod-close'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
