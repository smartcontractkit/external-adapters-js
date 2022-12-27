import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, PriceCryptoRequestParams } from '../../crypto-utils'
import { ForexEndpointTypes } from '../common/forex-router'

export const httpTransport = new HttpTransport<ForexEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/fx/top')
  },
  parseResponse: (params, res) => {
    return res.data.map((entry) => {
      const param = params.find(
        (p) => `${p.base}${p.quote}`.toLowerCase() === entry.ticker,
      ) as PriceCryptoRequestParams
      return {
        params: param,
        response: {
          data: {
            result: entry.midPrice,
          },
          result: entry.midPrice,
        },
      }
    })
  },
})
