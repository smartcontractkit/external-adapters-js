import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (): MakeWSHandler => {
  const getSubscription = (symbol?: string) => {
    if (!symbol) return
    return 'subscribe_to_all'
  }
  const getSymbol = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoints.forex.inputParameters, {})
    if (validator.error) return
    const symbol = validator.validated.data.base.toUpperCase()
    const convert = validator.validated.data.quote.toUpperCase()
    return `${symbol.toLowerCase()}${convert.toLowerCase()}`
  }
  return () => {
    return {
      connection: {
        url: 'wss://sockets.1forge.com/socket',
      },
      subscribe: (input) => getSubscription(getSymbol(input)),
      onConnect: () => 'login',
      noHttp: true,
      unsubscribe: (input) => getSubscription(getSymbol(input)),
      subsFromMessage: (message) => {
        if (!message.s) return undefined
        return getSubscription(`${message.s.toLowerCase()}`)
      },
      isError: (message: any) => message.type === 'error',
      filter: () => false,
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['c'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
