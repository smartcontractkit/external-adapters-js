import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { EndpointTypes } from './price-router'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
const logger = makeLogger('TradinEconomics HTTP')

const transformInput = (input: PriceEndpointParams) => {
  const base = input.base.replace(' ', '').split(',')
  const quote = input.quote.replace(' ', '').split(',')
  return base
    .map((element, index) => {
      return `${element}:${quote[index]}`
    })
    .join(',')
}

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((input) => {
      const symbol = transformInput(input)
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url: `symbol/${symbol}`,
        params: {
          c: `${config.API_CLIENT_KEY}:${config.API_CLIENT_SECRET}`,
        },
      }
      return {
        params: [input],
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    const entry = {
      params: params[0],
    }
    if (!res.data) {
      const errorMessage = `Tradingeconomics provided no data for "${params[0].base}"`
      logger.warn(errorMessage)
      return [
        {
          ...entry,
          response: {
            statusCode: 502,
            errorMessage,
          },
        },
      ]
    }
    return res.data.map((m) => {
      return {
        ...entry,
        response: {
          data: {
            result: m.Last,
          },
          result: m.Last,
        },
      }
    })
  },
})
