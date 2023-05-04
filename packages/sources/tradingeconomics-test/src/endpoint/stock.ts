import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResponseBody } from './price'
import { StockEndpointTypes } from './stock-router'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('TradingEconomics HTTP Stock')

type HttpEndpointTypes = StockEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}
export const httpTransport = new HttpTransport<HttpEndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/symbol/${param.base}`,
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
