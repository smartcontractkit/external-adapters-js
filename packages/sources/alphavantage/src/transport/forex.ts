import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/forex'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { PriceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'

const logger = makeLogger('Alphavantage HttpEndpoint')

export interface ProviderResponseBody {
  'Realtime Currency Exchange Rate': {
    '1. From_Currency Code': string
    '2. From_Currency Name': string
    '3. To_Currency Code': string
    '4. To_Currency Name': string
    '5. Exchange Rate': string
    '6. Last Refreshed': string
    '7. Time Zone': string
    '8. Bid Price': string
    '9. Ask Price': string
  }
  'Error Message': string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

const error502 = (
  params: TypeFromDefinition<PriceEndpointInputParametersDefinition>[],
  errorMessage: string,
) => {
  logger.error(errorMessage)
  return params.map((param) => {
    return {
      params: param,
      response: {
        statusCode: 502,
        errorMessage,
      },
    }
  })
}
export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return params.map((param) => {
      const from = param.base
      const to = param.quote
      const requestConfig = {
        baseURL: settings.API_ENDPOINT,
        method: 'GET',
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: from,
          to_currency: to,
          from_symbol: from,
          to_symbol: to,
          symbol: from,
          market: to,
          apikey: settings.API_KEY,
        },
      }
      return {
        params: [param],
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    let errorMessage = res.data['Error Message']
    if (errorMessage) {
      logger.warn(errorMessage)
      return error502(params, errorMessage)
    }

    const realTimeCurrentExchangeRate = res.data['Realtime Currency Exchange Rate']
    if (!realTimeCurrentExchangeRate) {
      errorMessage = `There was a problem getting the 'Realtime Currency Exchange Rate' data from the source`
      return error502(params, errorMessage)
    }

    const exchangeRate = res.data['Realtime Currency Exchange Rate']['5. Exchange Rate']
    if (!exchangeRate) {
      errorMessage = `There was a problem getting the 'Exchange Rate' data from the source`
      return error502(params, errorMessage)
    }
    return params.map((param) => {
      const result = Number(exchangeRate)
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
