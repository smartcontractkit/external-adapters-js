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
  // TODO: Fix. This subscribes to the channels related to any of the products. This will receive indefinite number of messages
  const getSubscription = (products: string[]) =>  ({
    type: 'hello',
    apikey: config.apiKey,
    heartbeat: false,
    subscribe_data_type: ['exrate'],
    subscribe_filter_asset_id: products
  }) 
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
      return getSubscription([base, quote])
    },
    unsubscribe: () => '',
    subsFromMessage: (message) => getSubscription([message.asset_id_base, message.asset_id_quote]),
    isError: () => false,
    filter: (message) => message?.type === 'exrate',
    parse: (wsResponse: any): number => {
      const result = Requester.validateResultNumber(wsResponse, ['rate'])
      return result
    }
  }
}
