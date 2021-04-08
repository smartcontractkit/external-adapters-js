import { Requester } from '@chainlink/ea-bootstrap'
import { Config, WSSubscriptionHandler } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *
 */

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://api.coinbase.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}

export const makeWSHandler = (): WSSubscriptionHandler => {
  return {
    connection: {
      url: 'ws://localhost:5050' // TODO: Necessary?
    },
    subscribe: (input) => {
      return `${input.data.base}_${input.data.quote}`
    },
    parse: (wsResponse: any): any | undefined => {
      // TODO: parses to find the relevant info from the wsResponse
      console.log('PARSING WS MESSAGE:', wsResponse)
      if (wsResponse.price) {
        return wsResponse.price
      }
      return 
    }
  }
}
