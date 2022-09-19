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
import { AccessTokenResponse, AccessToken, Pair, TickerMessage } from './types'

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

const getAccessToken = async (config: Config): Promise<AccessToken> => {
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
    return {
      token: tokenResponse.data.token,
      created: new Date().getTime(),
    }
  } catch (e: any) {
    const err = e as any
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
  let token: AccessToken | undefined
  let fetchingToken = false

  const refreshToken = async (config: Config) => {
    if (fetchingToken) return

    try {
      if (!token) {
        // Get inital token
        fetchingToken = true
        token = await getAccessToken(config)
        fetchingToken = false
        return
      }

      // Refresh token if it is older than 30 seconds
      if (new Date().getTime() - token.created > 30000) {
        fetchingToken = true
        token = await getAccessToken(config)
        fetchingToken = false
        return
      }
    } catch (error) {
      fetchingToken = false
    }
  }
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
    await refreshToken(config)

    return {
      connection: {
        url: config.ws?.baseWsURL,
        protocol: { headers: { ...config.api?.headers, token: token?.token || '' } },
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
