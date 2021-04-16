import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, WSSubscriptionHandler } from '@chainlink/types'
import * as endpoint from './endpoint'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 */

export const NAME = 'COINAPI'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://rest.coinapi.io/v1/'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws.coinapi.io/v1/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT,
    params: {
      apikey: config.apiKey,
    },
  }
  return config
}

export const makeWSHandler = (config: Config): WSSubscriptionHandler => {
  return {
    connection: {
      url: config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT
    },
    subscribe: (input) => {
      const validator = new Validator(input, endpoint.price.customParams)
      if (validator.error) {
        return 
      }
      const base = validator.overrideSymbol(NAME).toLowerCase()
      const quote = validator.validated.data.quote.toLowerCase()
      return {
        type: 'hello',
        apiKey: config.apiKey,
        heartbeat: false,
        subscribe_data_type: ['exrate'],
        subscribe_filter_asset_id: [base, quote]
      }
    },
    unsubscribe: () => '',
    subsFromMessage: () => '',
    isError: () => false,
    filter: () => true,
    parse: (wsResponse: any): number => {
      const result = Requester.validateResultNumber(wsResponse, ['rate'])
      return result
    },
    toAdapterResponse: (result: any) => {
      return Requester.success('1', { data: { result } })
    }
  }
}
