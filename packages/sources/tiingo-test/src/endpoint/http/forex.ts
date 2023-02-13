import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody } from '../../crypto-utils'
import { ForexEndpointTypes } from '../common/forex-router'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'

export const httpTransport = new HttpTransport<ForexEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/fx/top')
  },
  parseResponse: (params, res) => {
    return res.data.map((entry) => {
      const param = params.find(
        (p) => `${p.base}${p.quote}`.toLowerCase() === entry.ticker,
      ) as PriceEndpointParams
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
