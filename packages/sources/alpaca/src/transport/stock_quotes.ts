import {
  TransportDependencies,
  WebSocketTransport,
} from '@chainlink/external-adapter-framework/transports'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { BaseEndpointTypes } from '../endpoint/stock_quotes'

interface AuthResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface WsQuoteMessage {
  T: string // message type
  S: string // symbol
  bp: number // bid price
  bs: number // bid volume
  bx: string // bid exchange code
  ap: number // ask price
  as: number // ask volume
  ax: string // ask exchange code
  t: string // timestamp in ISO 8601 format
}

export interface WsAuthMessage {
  T: 'success'
  msg: 'authenticated'
}

export interface WsSubscriptionMessage {
  T: 'subscription'
  trades: unknown[]
  bars: unknown[]
  quotes: string[]
}

export type WsMessage = WsQuoteMessage

export type WSResponse = WsMessage[]

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}
export class StockQuotesWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<WsTransportTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
  }

  constructor() {
    super({
      url: (context) => context.adapterSettings.WS_API_ENDPOINT,
      handlers: {
        open: async (connection, context) => {
          console.log('\ndskloetx open\n')

          const requestConfig = {
            url: context.adapterSettings.AUTH_ENDPOINT,
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: {
              grant_type: 'client_credentials',
              client_id: context.adapterSettings.CLIENT_ID,
              client_secret: context.adapterSettings.CLIENT_SECRET,
            },
          }
          const authResponse = await transport.requester.request<AuthResponse>(
            JSON.stringify(requestConfig),
            requestConfig,
          )
          const accessToken = authResponse.response.data.access_token
          console.log('\ndskloet access_token', accessToken)

          connection.send(
            JSON.stringify({
              action: 'auth',
              key: 'access_token',
              secret: accessToken,
            }),
          )
        },
        heartbeat: (connection) => {
          connection.ping(`${Date.now()}`)
          // Don't do this if there are no subscriptions?
          transport.lastMessageReceivedAt = Date.now()
        },
        message(response) {
          return response
            .map((message) => {
              console.log('\ndskloetx message', message)
              if (['success', 'subscription'].includes(message.T)) {
                return
              }

              return {
                params: { base: message.S },
                response: {
                  result: message.bp,
                  data: {
                    result: message.bp,
                  },
                  timestamps: {
                    providerIndicatedTimeUnixMs: new Date(message.t).getTime(),
                  },
                },
              }
            })
            .filter((r) => r !== undefined)
        },
      },
      builders: {
        subscribeMessage: (params) => {
          return { action: 'subscribe', quotes: [params.base] }
        },
        unsubscribeMessage: (params) => {
          return { action: 'unsubscribe', quotes: [params.base] }
        },
      },
    })
    const transport = this
  }
}

export const wsTransport = new StockQuotesWebSocketTransport()
