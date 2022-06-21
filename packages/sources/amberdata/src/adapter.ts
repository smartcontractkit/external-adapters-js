import { Requester, Validator, Builder, DefaultConfig } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  ExecuteFactory,
  ExecuteWithConfig,
  MakeWSHandler,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_WS_API_ENDPOINT, makeConfig, NAME } from './config'
import * as endpoints from './endpoint'
import { crypto } from './endpoint'
import includes from './config/includes.json'

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<DefaultConfig, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<DefaultConfig, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<DefaultConfig, endpoints.TInputParameters> =>
  Builder.selectEndpoint<DefaultConfig, endpoints.TInputParameters>(
    request,
    makeConfig(),
    endpoints,
  )

export const makeExecute: ExecuteFactory<DefaultConfig, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

interface Message {
  params: {
    result: {
      last: number
      pair: string
    }
    subscription: string
  }
}

export const makeWSHandler = (defaultConfig?: DefaultConfig): MakeWSHandler<Message | any> =>
  // TODO : WS message types
  {
    const subscriptions: Record<string, unknown> = {}
    const getPair = (input: AdapterRequest) => {
      const validator = new Validator(
        input,
        crypto.inputParameters,
        {},
        { shouldThrowError: false, includes },
      )
      if (validator.error) return ''
      const base = validator.overrideSymbol(NAME, validator.validated.data.base).toLowerCase()
      const quote = validator.validated.data.quote.toLowerCase()
      return `${base}_${quote}`
    }
    const getSubscription = (pair?: string) => {
      if (!pair) return ''
      return { id: 1, method: 'subscribe', params: ['market:tickers', { pair }] }
    }
    const getUnsubscription = (pair?: string) => {
      if (!pair) return ''
      return { id: 1, method: 'unsubscribe', params: [subscriptions[pair]] }
    }

    return () => {
      const config = defaultConfig || makeConfig()
      return {
        connection: {
          url: config.ws?.baseWsURL || DEFAULT_WS_API_ENDPOINT,
          protocol: { headers: { ...config.api?.headers } },
        } as any,
        subscribe: (input) => getSubscription(getPair(input)),
        unsubscribe: (input) => getUnsubscription(getPair(input)),
        subsFromMessage: (message: Message) => {
          const pair = message?.params?.result?.pair
          subscriptions[pair] = message?.params?.subscription
          return getSubscription(message?.params?.result?.pair)
        },
        // https://github.com/web3data/web3data-js/blob/5b177803cb168dcaed0a8a6e2b2fbd835b82e0f9/src/websocket.js#L43
        isError: () => false, // Amberdata never receives error types?
        filter: (message: Message) => !!message.params,
        toResponse: (message: Message) => {
          const result = Requester.validateResultNumber(message, ['params', 'result', 'last'])
          return Requester.success('1', { data: { result } })
        },
      }
    }
  }
