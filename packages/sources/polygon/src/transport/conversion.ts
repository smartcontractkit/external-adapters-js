import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/conversion'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Polygon conversion')

interface ProviderResponseBody {
  converted: number
  from: string
  initialAmount: number
  last: { ask: number; bid: number; exchange: number; timestamp: number }
  request_id: string
  status: string
  symbol: string
  to: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      const from = param.base.toUpperCase()
      const to = param.quote.toUpperCase()
      const amount = param.amount
      const precision = param.precision
      const url = `/v1/conversion/${from}/${to}`
      return {
        params: [param],
        request: {
          baseURL: settings.API_ENDPOINT,
          url,
          params: {
            apikey: settings.API_KEY,
            amount,
            precision,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = res.data?.converted
      if (!result) {
        const message = `The data provider didn't return any value for ${JSON.stringify(param)}`
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
            result,
          },
          result,
        },
      }
    })
  },
})
