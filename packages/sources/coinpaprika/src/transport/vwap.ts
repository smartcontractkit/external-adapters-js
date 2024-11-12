import { getApiEndpoint, getApiHeaders } from '../config'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/vwap'

interface Response {
  timestamp: string
  price: number
  volume_24h: number
  market_cap: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: Response[]
  }
}
const formatUtcDate = (date: Date) => date.toISOString().split('T')[0]

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const coin = param.coinid ?? param.base
      const url = `v1/tickers/${coin?.toLowerCase()}/historical`

      const baseURL = getApiEndpoint(config)

      const endDate = new Date()
      const subMs = param.hours * 60 * 60 * 1000
      const startDate = new Date(endDate.getTime() - subMs)

      const reqParams = {
        start: formatUtcDate(startDate),
        interval: `${param.hours}h`,
      }

      return {
        params: [{ coinid: param.coinid, base: param.base, hours: param.hours }],
        request: {
          baseURL,
          url,
          method: 'GET',
          params: reqParams,
          headers: getApiHeaders(config),
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      return {
        params: { coinid: param.coinid, base: param.base, hours: param.hours },
        response: {
          data: {
            result: res.data[0].price,
          },
          result: res.data[0].price,
        },
      }
    })
  },
})
