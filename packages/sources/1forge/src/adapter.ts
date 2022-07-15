import { Builder, Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  DefaultConfig,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_WS_API_ENDPOINT, makeConfig } from './config'
import * as endpoints from './endpoint'

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

export const makeWSHandler = (config?: DefaultConfig): MakeWSHandler => {
  const getSubscription = (symbol?: string, subscribe = true): string => {
    if (!symbol) return ''
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
    if (Array.isArray(validator.validated.data.quote)) {
      Logger.debug(
        `[WS]: ${validator.validated.data.quote} supplied as quote. Only non-array tickers can be used for WS`,
      )
      return
    }
    if (Array.isArray(validator.validated.data.base)) {
      Logger.debug(
        `[WS]: ${validator.validated.data.base} supplied as base. Only non-array tickers can be used for WS`,
      )
      return
    }
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
      subsFromMessage: (message: any) => {
        if (!message.data || message.data.indexOf('update') === -1) return
        const { data } = parseResponse(message.data)
        return getSubscription(data.s)
      },
      isError: () => false,
      filter: (message: any) => message.data.indexOf('update') !== -1,
      toResponse: (message: any) => {
        const { data } = parseResponse(message.data)
        return Requester.success('1', { data: { result: data.p } })
      },
      onConnectChain: [
        {
          payload: `login|${defaultConfig.apiKey}`,
          filter: (message: any) => message.data.indexOf('post_login_success') !== -1,
        },
      ],
    }
  }
}
