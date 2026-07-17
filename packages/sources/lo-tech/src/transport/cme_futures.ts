import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { tz } from '@date-fns/tz'
import { isValid, parseISO, startOfDay } from 'date-fns'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/cme_futures'

const logger = makeLogger('lo-tech - cme_futures')

export type WSResponse =
  | {
      egress_ts: number // microseconds
      data: {
        type: 'PRICE'
        symbol: string
        generic_symbol: string
        ingress_ts: number // microseconds
        publish_ts: null
        transaction_ts: number // microseconds
        price: number
        spread: number
        expiry_date: string
        roll_date: string
      }
    }
  | {
      egress_ts: number // microseconds
      error: {
        error: string
        code: number
        id: null
        info: {
          type: string
          failures: {
            symbol: string
            type: string
          }[]
          succeeded: []
        }
      }
    }
  | {
      egress_ts: number // microseconds
      pong: {
        api_version: string
      }
    }

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const monthCodes = 'FGHJKMNQUVXZ'

export const getContractMonthFromSymbol = (symbol: string): number => {
  if (!symbol || symbol.length < 2) {
    throw new AdapterError({
      statusCode: 502,
      message: `Symbol must be at least 2 characters long. Received: '${symbol}'`,
    })
  }
  const monthCode = symbol.at(-2)!
  if (!monthCodes.includes(monthCode)) {
    throw new AdapterError({
      statusCode: 502,
      message: `Second to last character of symbol must be a valid month code. Received: '${symbol}'`,
    })
  }

  return 1 + monthCodes.indexOf(monthCode)
}

export const getRollDateTimestampSeconds = (
  rollDate: string,
  settings: typeof config.settings,
): number => {
  const timezone = tz(settings.ROLL_DATE_TIMEZONE)
  const date = parseISO(rollDate, { in: timezone })
  if (!isValid(date)) {
    throw new AdapterError({
      statusCode: 502,
      message: `Invalid roll date from data provider: '${rollDate}'`,
    })
  }
  return startOfDay(date).getTime() / 1000 + settings.ROLL_DATE_TIME_SECONDS
}

export class CmeFuturesWebSocketTransport extends WebSocketTransport<WsTransportTypes> {
  constructor() {
    super({
      url: (context) => {
        return context.adapterSettings.FUTURES_WS_API_ENDPOINT!
      },
      options: (context) => {
        return {
          headers: {
            'X-API-KEY': context.adapterSettings.FUTURES_API_KEY!,
          },
        }
      },
      handlers: {
        heartbeat(connection) {
          connection.send(
            JSON.stringify({
              op: 'PING',
            }),
          )
        },
        message(message, context) {
          if ('error' in message) {
            logger.error(`Received error message on websocket: ${JSON.stringify(message)}`)
            return message.error.info.failures.map((failure) => ({
              params: { base: failure.symbol },
              response: {
                statusCode: 502,
                errorMessage: failure.type,
                timestamps: {
                  providerIndicatedTimeUnixMs: Math.floor(message.egress_ts / 1000),
                },
              },
            }))
          }

          if ('pong' in message) {
            // Ignore
            return
          }

          if (message.data?.type !== 'PRICE') {
            logger.warn(`Received unsupported message type: ${message.data?.type}`)
            return
          }

          const { price, spread, symbol, generic_symbol, expiry_date, roll_date, ingress_ts } =
            message.data

          try {
            const mid_price = price
            const bid_price = mid_price - spread / 2
            const ask_price = mid_price + spread / 2

            const contract_month = getContractMonthFromSymbol(symbol)

            return [
              {
                params: { base: generic_symbol },
                response: {
                  result: null,
                  data: {
                    mid_price,
                    bid_price,
                    ask_price,
                    bid_volume: 0,
                    ask_volume: 0,
                    roll_date: getRollDateTimestampSeconds(roll_date, context.adapterSettings),
                    symbol,
                    generic_symbol,
                    expiry_date,
                    contract_month,
                    ingress_ts_iso: new Date(ingress_ts / 1000).toISOString(),
                  },
                  timestamps: {
                    providerIndicatedTimeUnixMs: Math.floor(message.egress_ts / 1000),
                  },
                },
              },
            ]
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            const statusCode = error instanceof AdapterError ? error.statusCode : 500

            return [
              {
                params: { base: generic_symbol },
                response: {
                  statusCode,
                  errorMessage,
                  timestamps: {
                    providerIndicatedTimeUnixMs: Math.floor(message.egress_ts / 1000),
                  },
                },
              },
            ]
          }
        },
      },
      builders: {
        subscribeMessage: (params) => {
          return {
            op: 'SUBSCRIBE',
            topics: [
              {
                symbol: params.base,
                type: 'PRICE',
              },
            ],
          }
        },
        unsubscribeMessage: (params) => {
          return {
            op: 'UNSUBSCRIBE',
            topics: [
              {
                symbol: params.base,
                type: 'PRICE',
              },
            ],
          }
        },
      },
    })
  }
}

export const cmeFuturesTransport = new CmeFuturesWebSocketTransport()
