import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_ENDPOINT, DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import { price } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case price.NAME: {
      return await price.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
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
    const validator = new Validator(input, price.customParams, {}, false)
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
