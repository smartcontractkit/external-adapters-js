import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/types'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (symbol?: string, subscribe = true) => {
    if (!symbol) return
    return subscribe ? `subscribe_to|${symbol}` : `unsubscribe_from|${symbol}`
  }
  const getSymbol = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.quotes.inputParameters,
      {},
      { shouldThrowError: false },
    )
    if (validator.error) return
    const symbol = validator.validated.data.base.toUpperCase()
    const convert = validator.validated.data.quote.toUpperCase()
    return `${symbol}/${convert}`
  }
  const parseResponse = (response: string) => {
    const [type, data] = response.split('|')
    return { type, data: JSON.parse(data) }
  }

  return () => {
    const defaultConfig = config || makeConfig()

    return {
      connection: {
        url: DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getSymbol(input)),
      unsubscribe: (input) => getSubscription(getSymbol(input), false),
      subsFromMessage: (message) => {
        if (!message.data || message.data.indexOf('update') === -1) return
        const { data } = parseResponse(message.data)
        return getSubscription(data.s)
      },
      isError: () => false,
      filter: (message) => message.data.indexOf('update') !== -1,
      toResponse: (message) => {
        const { data } = parseResponse(message.data)
        return Requester.success('1', { data: { result: data.p } })
      },
      onConnectChain: [
        {
          payload: `login|${defaultConfig.apiKey}`,
          filter: (message: { data: string }) => message.data.indexOf('post_login_success') !== -1,
        },
      ],
    }
  }
}
