import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/forex'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('FinaltoWSTransport')

export interface WSResponse {
  MsgSeqNum: string
  MsgType: string
  Prices: {
    Px: string
    Type: 'B' | 'O'
    Vol: string
  }[]
  SendTime: string
  SubID: string
  Symbol: string
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

let subscriptionId = 2 // DP errors if the subId starts with '1'
const subscriptionIdMap: Record<string, number> = {}

const getSubscriptionId = (symbol: string, deleteOnGet = false): string => {
  if (subscriptionIdMap[symbol]) {
    if (deleteOnGet) {
      const value = subscriptionIdMap[symbol].toString()
      delete subscriptionIdMap[symbol]
      return value
    }
    return subscriptionIdMap[symbol].toString()
  }
  subscriptionIdMap[symbol] = subscriptionId
  subscriptionId++
  return subscriptionIdMap[symbol].toString()
}

// DP returns the date info in an unparseable format like 20240112-11:11:11.111
const parseDate = (dateLike: string): number => {
  const year = dateLike.substring(0, 4)
  const month = dateLike.substring(4, 6)
  const day = dateLike.substring(6, 8)
  const rest = dateLike.slice(8)
  return new Date(`${year}.${month}.${day}${rest}Z`).getTime()
}

export const wsTransport: WebsocketReverseMappingTransport<WsTransportTypes, string> =
  new WebsocketReverseMappingTransport<WsTransportTypes, string>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT,
    handlers: {
      open(connection, context) {
        return new Promise((resolve) => {
          connection.addEventListener('message', (event: MessageEvent) => {
            const parsed = JSON.parse(event.data.toString())
            if (parsed.MsgType === 'Logon') {
              logger.info('Got logged in response, connection is ready')
              resolve()
            }
          })
          connection.send(
            JSON.stringify({
              MsgType: 'Logon',
              Username: context.adapterSettings.WS_API_USERNAME,
              Password: context.adapterSettings.WS_API_PASSWORD,
            }),
          )
        })
      },
      message(message) {
        if (message.MsgType !== 'SymbolPrices') {
          logger.warn(JSON.stringify(message), 'Unexpected message')
          return
        }

        const pair = wsTransport.getReverseMapping(message.Symbol)

        if (!pair) {
          logger.warn(`Reverse mapping pair for '${message.Symbol}' was not found`)
          return
        }

        if (!message.Prices.length) {
          return [
            {
              params: { base: pair.base, quote: pair.quote },
              response: {
                errorMessage: `Missing price info for '${pair.base}${pair.quote}'`,
                statusCode: 502,
              },
            },
          ]
        }

        const bidInfo = message.Prices.find((p) => p.Type === 'B')
        const askInfo = message.Prices.find((p) => p.Type === 'O')

        if (!bidInfo || !askInfo || !bidInfo.Px || !askInfo.Px) {
          return [
            {
              params: { base: pair.base, quote: pair.quote },
              response: {
                errorMessage: `Missing bid and/or ask prices for '${pair.base}${pair.quote}'`,
                statusCode: 502,
              },
            },
          ]
        }

        const result = (Number(bidInfo.Px) + Number(askInfo.Px)) / 2

        return [
          {
            params: { base: pair.base, quote: pair.quote },
            response: {
              result,
              data: {
                result,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: parseDate(message.SendTime),
              },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (params) => {
        const symbol = `${params.base}${params.quote}`.toUpperCase()
        wsTransport.setReverseMapping(symbol, params)
        const id = getSubscriptionId(symbol)
        return {
          MsgType: 'SubscribePrices',
          SubID: id,
          MarketDepth: 1,
          PriceUpdateType: 'Full',
          SubRequestType: 'Subscribe',
          PriceTypes: [{ Type: 'B' }, { Type: 'O' }],
          Symbols: [{ Symbol: symbol }],
        }
      },
      unsubscribeMessage: (params) => {
        const symbol = `${params.base}${params.quote}`.toUpperCase()
        const id = getSubscriptionId(symbol, true)
        return {
          MsgType: 'SubscribePrices',
          SubID: id,
          MarketDepth: 1,
          PriceUpdateType: 'Full',
          SubRequestType: 'Unsubscribe',
          PriceTypes: [{ Type: 'B' }, { Type: 'O' }],
          Symbols: [{ Symbol: symbol }],
        }
      },
    },
  })
