import crypto from 'crypto'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/price'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import axios from 'axios'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('GSR WS price')

type WsMessage = {
  type: string
  data: {
    symbol: string
    price: number
    ts: number
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

export interface TokenError {
  success: false
  ts: number
  error: string
}

export interface TokenSuccess {
  success: true
  ts: number
  token: string
  validUntil: string
}

export type AccessTokenResponse = TokenError | TokenSuccess

const currentTimeNanoSeconds = (): number => new Date(Date.now()).getTime() * 1000000

const generateSignature = (userId: string, publicKey: string, privateKey: string, ts: number) =>
  crypto
    .createHmac('sha256', privateKey)
    .update(`userId=${userId}&apiKey=${publicKey}&ts=${ts}`)
    .digest('hex')

const getToken = async (settings: typeof config.settings) => {
  logger.debug('Fetching new access token')

  const userId = settings.WS_USER_ID
  const publicKey = settings.WS_PUBLIC_KEY
  const privateKey = settings.WS_PRIVATE_KEY
  const ts = currentTimeNanoSeconds()
  const signature = generateSignature(userId, publicKey, privateKey, ts)
  const response = await axios.post<AccessTokenResponse>(`${settings.API_ENDPOINT}/token`, {
    apiKey: publicKey,
    userId,
    ts,
    signature,
  })

  if (!response.data.success) {
    logger.error('Unable to get access token')
    throw new Error(response.data.error)
  }

  return response.data.token
}

export const transport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_API_ENDPOINT,
  options: async (context) => ({
    headers: {
      'x-auth-token': await getToken(context.adapterSettings),
      'x-auth-userid': context.adapterSettings.WS_USER_ID,
    },
  }),
  handlers: {
    open: () => {
      return
    },
    message(message): ProviderResult<WsTransportTypes>[] | undefined {
      if (message.type == 'error') {
        logger.error(`Got error from DP: ${JSON.stringify(message)}`)
        return
      } else if (message.type != 'ticker') {
        return
      }

      const pair = message.data.symbol.split('.')
      if (pair.length != 2) {
        logger.warn(`Got a price update with an unknown pair: ${message.data.symbol}`)
        return
      }

      return [
        {
          params: {
            base: pair[0].toString(),
            quote: pair[1].toString(),
          },
          response: {
            result: message.data.price,
            data: {
              result: message.data.price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: Math.round(message.data.ts / 1e6), // Value from provider is in nanoseconds
            },
          },
        },
      ]
    },
  },
  builders: {
    // Note: As of writing this (2022-11-07), GSR has a bug where you cannot subscribe to a pair
    // after you've already subscribed & unsubscribed to that pair on the same WS connection.
    subscribeMessage: (params) => ({
      action: 'subscribe',
      symbols: [`${params.base.toUpperCase()}.${params.quote.toUpperCase()}`],
    }),
    unsubscribeMessage: (params) => ({
      action: 'unsubscribe',
      symbols: [`${params.base.toUpperCase()}.${params.quote.toUpperCase()}`],
    }),
  },
})
