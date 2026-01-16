import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Decimal } from 'decimal.js'
import { v4 as uuidv4 } from 'uuid'
import { BaseEndpointTypes } from '../endpoint/quote'

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

const subscriptionIdMap: Record<string, string> = {}

const getSubscriptionId = (symbol: string): string => {
  if (subscriptionIdMap[symbol]) {
    return subscriptionIdMap[symbol]
  }
  const uniqueKey = uuidv4()
  subscriptionIdMap[symbol] = `${symbol}-${uniqueKey}`
  return subscriptionIdMap[symbol]
}

const buildSymbol = ({ base, quote }: { base: string; quote: string }): string => {
  if (base.includes('.')) {
    // e.g. "AAPL.xnas"
    return base
  }
  return `${base}${quote}`.toUpperCase()
}

// DP returns the date info in an unparseable format like 20240112-11:11:11.111
const parseDate = (dateLike: string): number => {
  const year = dateLike.substring(0, 4)
  const month = dateLike.substring(4, 6)
  const day = dateLike.substring(6, 8)
  const rest = dateLike.slice(8)
  return new Date(`${year}.${month}.${day}${rest}Z`).getTime()
}

// Conversion factor from pounds to tonnes (1 tonne = 2204.62 lbs)
const LBS_PER_TONNE = 2204.62

// Parse result to handle special cases for specific symbols
const parseResult = (base: string, quote: string, result: number): number => {
  // Finalto prices XCU/USD in $ per tonne, convert to $ per lb
  if (base === 'XCU' && quote === 'USD') {
    result = Decimal.div(result, LBS_PER_TONNE).toNumber()
  }
  return result
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
          logger.warn(`Unexpected message: ${JSON.stringify(message)}`)
          return
        }

        const pair = wsTransport.getReverseMapping(message.Symbol)

        if (!pair) {
          logger.warn(`Reverse mapping pair for '${message.Symbol}' was not found`)
          return
        }

        if (!message.Prices.length) {
          return getErrorResponse('Missing price info', pair)
        }

        const bidInfo = message.Prices.find((p) => p.Type === 'B')
        const askInfo = message.Prices.find((p) => p.Type === 'O')

        if (!bidInfo || !askInfo || !bidInfo.Px || !askInfo.Px) {
          return getErrorResponse('Missing bid and/or ask prices', pair)
        }

        if (!bidInfo.Vol || !askInfo.Vol) {
          return getErrorResponse('Missing bid and/or ask volumes', pair)
        }

        const bidPrice = Number(bidInfo.Px)
        const askPrice = Number(askInfo.Px)
        if (Number.isNaN(bidPrice) || Number.isNaN(askPrice)) {
          return getErrorResponse(`Invalid bid price ${bidPrice} or ask price ${askPrice}`, pair)
        }
        const bidVolume = Number(bidInfo.Vol)
        const askVolume = Number(askInfo.Vol)
        if (Number.isNaN(bidVolume) || Number.isNaN(askVolume)) {
          return getErrorResponse(`Invalid bid vol ${bidVolume} or ask vol ${askVolume}`, pair)
        }

        const mid = (bidPrice + askPrice) / 2

        let lwMidPrice: number
        if (bidPrice == 0) {
          lwMidPrice = askPrice
        } else if (askPrice == 0) {
          lwMidPrice = bidPrice
        } else {
          lwMidPrice = mid
        }

        // Apply symbol-specific transformations
        const transformedBid = parseResult(pair.base, pair.quote, bidPrice)
        const transformedAsk = parseResult(pair.base, pair.quote, askPrice)
        const transformedMid = parseResult(pair.base, pair.quote, mid)
        const transformedLwMid = parseResult(pair.base, pair.quote, lwMidPrice)

        return [
          {
            params: { base: pair.base, quote: pair.quote },
            response: {
              result: transformedMid,
              data: {
                result: transformedMid,
                bid: transformedBid,
                mid: transformedMid,
                ask: transformedAsk,
                // Used by 24/5 feeds
                mid_price: transformedLwMid,
                bid_price: transformedBid,
                bid_volume: bidVolume,
                ask_price: transformedAsk,
                ask_volume: askVolume,
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
        const symbol = buildSymbol(params)
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
        const symbol = buildSymbol(params)
        const id = getSubscriptionId(symbol)
        delete subscriptionIdMap[symbol]
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

const getErrorResponse = (message: string, pair: { base: string; quote: string }) => [
  {
    params: { base: pair.base, quote: pair.quote },
    response: {
      errorMessage: `${message} for '${pair.base}:${pair.quote}'`,
      statusCode: 502,
    },
  },
]
