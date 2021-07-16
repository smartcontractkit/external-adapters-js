import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import { crypto } from './endpoint'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  return Builder.buildSelector(request, config, endpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (productId?: string, subscribe = true) => {
    if (!productId) return
    return {
      type: subscribe ? 'subscribe' : 'unsubscribe',
      channels: ['ticker'],
      product_ids: [productId],
    }
  }
  const getProductId = (input: AdapterRequest) => {
    const validator = new Validator(input, crypto.inputParameters, {}, false)
    if (validator.error) return
    const symbol = validator.validated.data.symbol.toUpperCase()
    const convert = validator.validated.data.convert.toUpperCase()
    return `${symbol}-${convert}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getProductId(input)),
      unsubscribe: (input) => getSubscription(getProductId(input), false),
      subsFromMessage: (message) => getSubscription(`${message?.product_id}`),
      isError: (message: any) => message.type === 'error',
      // Ignore everything is not a ticker message. Throw an error on incoming errors.
      filter: (message: any) => message.type === 'ticker',
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['price'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
