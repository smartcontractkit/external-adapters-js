import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { buildBatchedRequestBody, inputParameters } from '../../crypto-utils'
import { customSettings } from '../../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

interface ProviderResponseBody {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  topOfBookData: {
    askSize: number
    bidSize: number
    lastSaleTimestamp: string
    lastPrice: number
    askPrice: number
    quoteTimestamp: string
    bidExchange: string
    lastSizeNotional: number
    lastExchange: string
    askExchange: string
    bidPrice: number
    lastSize: number
  }[]
}

type TopEndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const httpTransport = new HttpTransport<TopEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/crypto/top')
  },
  parseResponse: (_, res) => {
    return res.data.map((entry) => {
      return {
        params: { base: entry.baseCurrency, quote: entry.quoteCurrency },
        response: {
          data: {
            result: entry.topOfBookData[0].lastPrice,
          },
          result: entry.topOfBookData[0].lastPrice,
        },
      }
    })
  },
})

export const endpoint = new PriceEndpoint<TopEndpointTypes>({
  name: 'top',
  transport: httpTransport,
  inputParameters: inputParameters,
})
