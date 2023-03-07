import { EndpointTypes } from './router'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { adapterConfig } from '../config'

const logger = makeLogger('Alphavantage HttpEndpoint')

export const httpTransport = new HttpTransport<EndpointTypes>({
  prepareRequests: (params) => {
    adapterConfig.initialize()
    adapterConfig.validate()

    return params.map((param) => {
      const from = param.base
      const to = param.quote
      const requestConfig = {
        baseURL: adapterConfig.settings.API_ENDPOINT,
        method: 'GET',
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: from,
          to_currency: to,
          from_symbol: from,
          to_symbol: to,
          symbol: from,
          market: to,
          apikey: adapterConfig.settings.API_KEY,
        },
      }
      return {
        params,
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    if (!res.data) {
      logger.error(`There was a problem getting the data from the source`)
      return []
    }

    const errorMessage = res.data['Error Message']
    if (errorMessage) {
      logger.warn(errorMessage)
      return [
        {
          params: { base: params[0].base, quote: params[0].quote },
          response: {
            statusCode: 502,
            errorMessage,
          },
        },
      ]
    }

    const realTimeCurrentExchangeRate = res.data['Realtime Currency Exchange Rate']
    if (!realTimeCurrentExchangeRate) {
      logger.error(
        `There was a problem getting the 'Realtime Currency Exchange Rate' data from the source`,
      )
      return []
    }

    const exchangeRate = res.data['Realtime Currency Exchange Rate']['5. Exchange Rate']
    if (!exchangeRate) {
      logger.error(`There was a problem getting the 'Exchange Rate' data from the source`)
      return []
    }
    return params.map((param) => {
      const result = Number(exchangeRate)
      return {
        params: { ...param },
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
