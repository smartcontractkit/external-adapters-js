import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResponseBody } from './price-http'
import { BaseEndpointTypes } from '../endpoint/stock'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('TradingEconomics HTTP Stock')

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const symbol = param.base.toUpperCase()
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/symbol/${symbol}`,
          params: {
            c: `${config.API_CLIENT_KEY}:${config.API_CLIENT_SECRET}`,
            f: `json`,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    const data = res.data[0]
    return params.map((param) => {
      if (!res.data || !data || data.Last === undefined) {
        const message = `Tradingeconomics provided no data for ${JSON.stringify(param)}`
        logger.info(message)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: message,
          },
        }
      }
      return {
        params: param,
        response: {
          data: {
            result: data.Last,
          },
          result: data.Last,
          timestamps: {
            providerIndicatedTimeUnixMs: new Date(data.Date).getTime(),
          },
        },
      }
    })
  },
})
