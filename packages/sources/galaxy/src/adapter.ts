import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
  Builder,
  Logger,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import type {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
  MakeWSHandler,
  Method,
} from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import * as endpoints from './endpoint'
import { AccessTokenResponse, Pair, TickerMessage } from './types'

type CustomError = {
  response: Record<string, unknown>
  request: Record<string, unknown>
  message: string
}

export const execute: ExecuteWithConfig<Config, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<Config, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<Config, endpoints.TInputParameters> =>
  Builder.selectEndpoint<Config, endpoints.TInputParameters>(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const getAccessToken = async (config: Config): Promise<string> => {
  try {
    const tokenResponse = await Requester.request<AccessTokenResponse>({
      url: config.api?.baseURL,
      method: 'get' as Method,
      headers: {
        'X-GALAXY-APIKEY': (config.adapterSpecificParams?.apiKey || '') as string,
        'X-GALAXY-PASSWORD': (config.adapterSpecificParams?.apiPassword || '') as string,
      },
    })
    if (!tokenResponse.data.token)
      throw new AdapterDataProviderError({ message: tokenResponse.data.message || 'Login failed' })
    return tokenResponse.data.token
  } catch (e) {
    const err = e as CustomError
    const message = `Login failed ${err.message ? `with message '${err.message}'` : ''}`
    const error = { ...err, message }
    Logger.debug(message)
    throw error.response
      ? new AdapterDataProviderError(error)
      : error.request
      ? new AdapterConnectionError(error)
      : new AdapterError(error)
  }
}

export const makeWSHandler = (defaultConfig?: Config): MakeWSHandler<any> => {
  let token: string | undefined
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.price.inputParameters,
      {},
      { shouldThrowError: false },
    )
    const { base = '', quote = '' } = validator.validated.data
    return base && quote && `markPrice_${base.toUpperCase()}/${quote.toUpperCase()}`
  }

  return async () => {
    const config = defaultConfig || makeConfig()
    if (!token) token = await getAccessToken(config)

    return {
      connection: {
        url: config.ws?.baseWsURL,
        protocol: { headers: { ...config.api?.headers, token } },
      },
      noHttp: true,
      subscribe: (input: AdapterRequest) => ({ type: 'subscribe', signals: [getPair(input)] }),
      unsubscribe: (input: AdapterRequest) => ({ type: 'unsubscribe', signals: [getPair(input)] }),
      subsFromMessage: (message: TickerMessage, subscriptionMessage: Pair) => {
        if (message.type !== 'signal_update') return
        if (!subscriptionMessage.signals.includes(message.signal)) return
        return { type: 'subscribe', signals: subscriptionMessage.signals }
      },
      isError: (message: TickerMessage) => message.type === 'error',
      filter: (message: TickerMessage) => message.type === 'signal_update',
      toResponse: (message: TickerMessage, input: AdapterRequest) => {
        const result = Requester.validateResultNumber(message, ['value'])
        return Requester.success(input.id, { data: { result, ts: message.ts } }, config.verbose)
      },
    } as any // TODO: connection type mismatch
  }
}
