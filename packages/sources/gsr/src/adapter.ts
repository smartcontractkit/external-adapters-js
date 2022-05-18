import { Builder, Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
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
import crypto from 'crypto'
import { AccessToken, AccessTokenResponse, TickerMessage } from './types'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

const currentTimeNanoSeconds = (): number => new Date(Date.now()).getTime() * 1000000

const generateSignatureString = (
  userId: string,
  ts: number,
  publicKey: string,
  token?: string,
): string =>
  token
    ? `userId=${userId}&token=${token}&ts=${ts}`
    : `userId=${userId}&apiKey=${publicKey}&ts=${ts}`

const generateSignature = (
  userId: string,
  publicKey: string,
  privateKey: string,
  ts: number,
  existingToken?: string,
) =>
  crypto
    .createHmac('sha256', privateKey)
    .update(generateSignatureString(userId, ts, publicKey, existingToken))
    .digest('hex')

export const getAccessToken = async (
  config: Config,
  existingToken?: AccessToken,
): Promise<AccessToken> => {
  try {
    const { userId, privateKey, publicKey } = config.adapterSpecificParams || {}
    const ts = currentTimeNanoSeconds()
    const signature = generateSignature(
      userId.toString(),
      publicKey.toString(),
      privateKey.toString(),
      ts,
      existingToken?.token,
    )
    const tokenOrKey = existingToken ? { token: existingToken.token } : { apiKey: publicKey }
    const data = {
      url: `${config.api?.baseURL}/token`,
      method: existingToken ? 'put' : 'post',
      data: {
        ...tokenOrKey,
        userId,
        ts,
        signature,
      },
    }

    const tokenResponse = await Requester.request<AccessTokenResponse>(data)
    if (!tokenResponse.data.success) throw new Error(tokenResponse.data.error)
    return {
      token: tokenResponse.data.token,
      validUntil: new Date(tokenResponse.data.validUntil).getTime(),
    }
  } catch (error) {
    Logger.debug(
      `Error: ${
        existingToken
          ? `failed to refresh token: ${existingToken.token}`
          : `failed to get new token`
      }, with error: ${error.message}`,
    )
    throw error
  }
}

export const makeWSHandler = (defaultConfig?: Config): MakeWSHandler => {
  let token: AccessToken | undefined
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(
      input,
      endpoints.price.inputParameters,
      {},
      { shouldThrowError: false },
    )
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}.${quote}`
  }

  const refreshToken = async (config: Config) => {
    try {
      if (!token) {
        // Get inital token
        token = await getAccessToken(config)
        return
      }

      // Refresh token if it has less than 5 mins validity remaining
      if (token.validUntil - new Date().getTime() < 300000)
        token = await getAccessToken(config, token)
    } catch (error) {
      token = undefined
      throw error
    }
  }

  return async () => {
    const config = defaultConfig || makeConfig()
    await refreshToken(config)

    return {
      connection: {
        url: config.api.baseWsURL,
        protocol: { headers: { ...config.api.headers, 'x-auth-token': token?.token || '' } },
      },
      noHttp: true,
      subscribe: (input) => ({ action: 'subscribe', symbols: [getPair(input)] }),
      unsubscribe: (input) => ({ action: 'unsubscribe', symbols: [getPair(input)] }),
      subsFromMessage: (message, subscriptionMessage) => {
        if (message.type !== 'ticker') return
        if (!subscriptionMessage.symbols.includes(message.data.symbol)) return
        return subscriptionMessage
      },
      isError: (message: TickerMessage) => message.type === 'error',
      filter: (message: TickerMessage) => message.type === 'ticker',
      toResponse: (message: TickerMessage, input: AdapterRequest) => {
        const result = Requester.validateResultNumber(message.data, ['price'])
        return Requester.success(
          input.id,
          { data: { result, ts: message.data.ts } },
          config.verbose,
        )
      },
    }
  }
}
