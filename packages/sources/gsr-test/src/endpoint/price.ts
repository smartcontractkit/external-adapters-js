import { customSettings } from '../config'
import {
  makeLogger,
  ProviderResult,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import {
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import crypto from 'crypto'
import axios from 'axios'

const logger = makeLogger('GSR WS price')

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

export interface AccessToken {
  token: string
  validUntil: number
}

export type AccessTokenResponse = TokenError | TokenSuccess

type WsMessage = {
  type: string
  data: {
    symbol: string
    price: number
    ts: number
  }
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: WsMessage
  }
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

let rawTokenData: AccessToken | undefined

const getToken = async (config: AdapterConfig<typeof customSettings>) => {
  // Re-use the token if it's valid for at least 5 more minutes
  if (rawTokenData && rawTokenData.validUntil - new Date().getTime() >= 5 * 60 * 1000) {
    logger.debug('Re-using existing access token')
    return rawTokenData.token
  }

  logger.debug('Fetching new access token')

  const userId = config.WS_USER_ID
  const publicKey = config.WS_PUBLIC_KEY
  const privateKey = config.WS_PRIVATE_KEY
  const ts = currentTimeNanoSeconds()
  const signature = generateSignature(userId, publicKey, privateKey, ts, rawTokenData?.token)
  const tokenOrKey = rawTokenData ? { token: rawTokenData.token } : { apiKey: publicKey }
  const data = {
    url: `${config.API_ENDPOINT}/token`,
    method: rawTokenData ? 'PUT' : 'POST',
    data: {
      ...tokenOrKey,
      userId,
      ts,
      signature,
    },
  }

  const response = await axios(data)

  if (!response.data.success) {
    logger.error('Unable to get access token')
    throw new Error(response.data.error)
  }

  rawTokenData = {
    token: response.data.token,
    validUntil: new Date(response.data.validUntil).getTime(),
  }

  logger.debug(`Successfully stored new access token`)

  return rawTokenData.token
}

export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => context.adapterConfig.WS_API_ENDPOINT,
  options: async (context) => ({
    headers: {
      'x-auth-token': await getToken(context.adapterConfig),
      'x-auth-userid': context.adapterConfig.WS_USER_ID,
    },
  }),
  handlers: {
    open: () => {
      return
    },
    message(message): ProviderResult<EndpointTypes>[] | undefined {
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
              providerIndicatedTime: message.data.ts,
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

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['price-ws'],
  transport: wsTransport,
  inputParameters: priceEndpointInputParameters,
})
