import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseEndpointTypes, Market, MARKETS } from '../endpoint/lwba'
import { BaseEndpointTypes as PriceBaseEndpointTypes } from '../endpoint/price'
import {
  RequestSchema,
  StreamMessageSchema,
  SubscribeSchema,
  UnsubscribeSchema,
  type StreamMessage,
} from '../gen/client_pb'
import { MarketDataSchema, type MarketData } from '../gen/md_cef_pb'
import { InstrumentQuoteCache, Quote } from './instrument-quote-cache'
import {
  decimalToNumber,
  hasSingleBidFrame,
  hasSingleOfferFrame,
  isSingleTradeFrame,
  parseIsin,
  pickProviderTime,
} from './proto-utils'
import { ProtobufWsTransport } from './protobuf-wstransport'

export type WsTransportTypes = (BaseEndpointTypes | PriceBaseEndpointTypes) & {
  Provider: {
    WsMessage: Buffer
  }
}

type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
}

const logger = makeLogger('DeutscheBoerseTransport')

export function createLwbaWsTransport<BaseEndpointTypes extends BaseTransportTypes>(
  extractData: (quote: Quote) => BaseEndpointTypes['Response']['Data'],
) {
  const cache = new InstrumentQuoteCache()
  let ttlInterval: ReturnType<typeof setInterval> | undefined
  const transport = new ProtobufWsTransport<WsTransportTypes>({
    url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/stream?format=proto`,
    options: async (context) => ({
      headers: { 'X-API-Key': context.adapterSettings.API_KEY },
      followRedirects: true,
    }),
    handlers: {
      open: async (_connection, context) => {
        logger.info('LWBA websocket connection established')

        // Clear any previous interval
        if (ttlInterval) {
          clearInterval(ttlInterval)
          ttlInterval = undefined
        }

        const doRefresh = async () => {
          try {
            await updateTTL(transport, context.adapterSettings.CACHE_MAX_AGE)
            logger.info(
              { refreshMs: context.adapterSettings.CACHE_TTL_REFRESH_MS },
              'Refreshed TTL for active subscriptions',
            )
          } catch (err) {
            logger.error({ err }, 'Failed TTL refresh')
          }
        }

        // Refresh immediately, then every minute
        await doRefresh()
        ttlInterval = setInterval(doRefresh, context.adapterSettings.CACHE_TTL_REFRESH_MS)
      },
      error: (errorEvent) => {
        logger.error({ errorEvent }, 'LWBA websocket error')
      },
      close: (closeEvent) => {
        const code = (closeEvent as any)?.code
        const reason = (closeEvent as any)?.reason
        const wasClean = (closeEvent as any)?.wasClean
        logger.info({ code, reason, wasClean }, 'LWBA websocket closed')
        if (ttlInterval) {
          clearInterval(ttlInterval)
          ttlInterval = undefined
        }
      },
      message(buf) {
        logger.debug(
          {
            payloadType: Buffer.isBuffer(buf) ? 'buffer' : typeof buf,
            byteLength: Buffer.isBuffer(buf) ? buf.byteLength : undefined,
          },
          'LWBA websocket message received',
        )

        const sm = decodeStreamMessage(buf)
        if (!sm) {
          return []
        }
        transport.lastMessageReceivedAt = Date.now()
        const decoded = decodeSingleMarketData(sm)
        if (!decoded) {
          return []
        }
        const { market, md } = decoded
        const result = processMarketData(md, cache, market)
        if (!result) {
          return []
        }
        const { isin, providerTime } = result
        const quote = cache.get(market, isin)
        if (quote == null) {
          logger.error({ isin, market }, 'Quote missing from cache after processing frame')
          return []
        }
        const responseData = extractData(quote)
        if (!responseData) {
          return []
        }
        return [
          {
            params: { isin, market },
            response: {
              result: null,
              data: responseData as WsTransportTypes['Response']['Data'],
              timestamps: { providerIndicatedTimeUnixMs: providerTime },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (p: { market: string; isin: string }) => {
        const firstForMarket = !cache.hasMarket(p.market)
        cache.activate(p.market, p.isin)
        if (firstForMarket) {
          const markets = cache.getMarkets()
          const req = create(RequestSchema, {
            event: 'subscribe',
            requestId: BigInt(Date.now()),
            subscribe: create(SubscribeSchema, {
              stream: markets.map((m) => ({ stream: m })),
            }),
          })
          logger.info({ markets }, 'Subscribing market streams (first activation for this market)')
          return toBinary(RequestSchema, req)
        }
        logger.debug(
          { isin: p.isin, market: p.market },
          'Instrument activated; stream already subscribed, no outbound subscribe message sent',
        )
        return undefined
      },

      unsubscribeMessage: (p: { market: string; isin: string }) => {
        cache.deactivate(p.market, p.isin)

        if (!cache.hasMarket(p.market)) {
          const req = create(RequestSchema, {
            event: 'unsubscribe',
            requestId: BigInt(Date.now()),
            unsubscribe: create(UnsubscribeSchema, {
              stream: [p.market],
            }),
          })
          logger.info({ market: p.market }, 'Unsubscribing market stream (market now empty)')
          return toBinary(RequestSchema, req)
        }
        logger.debug(
          { isin: p.isin, market: p.market },
          'Instrument deactivated; other instruments still active, no outbound unsubscribe sent',
        )
        return undefined
      },
    },
  })
  return transport
}

// --- helpers -----------------------------------------------------------------
function decodeStreamMessage(buf: Buffer): StreamMessage | null {
  try {
    return fromBinary(StreamMessageSchema, buf)
  } catch (err) {
    logger.error({ err }, 'Failed to decode Client.StreamMessage from binary')
    return null
  }
}

const updateTTL = async (transport: ProtobufWsTransport<WsTransportTypes>, ttl: number) => {
  const params = await transport.subscriptionSet.getAll()
  transport.responseCache.writeTTL(transport.name, params, ttl)
}
function processMarketData(
  md: MarketData,
  cache: InstrumentQuoteCache,
  market: string,
): {
  isin: string
  providerTime: number
} | null {
  const isin = parseIsin(md)
  if (!isin) {
    logger.warn('Could not parse ISIN from MarketData')
    return null
  }
  const dat: any = (md as MarketData)?.Dat
  if (!dat) {
    logger.warn('Could not parse MarketData from MarketData.Instrmt')
    return null
  }

  const quote = cache.get(market, isin)
  if (!quote) {
    logger.debug('Ignoring message for inactive instrument (not in cache)')
    return null
  }

  const providerTime = pickProviderTime(dat)

  if (isSingleTradeFrame(dat)) {
    const latestPrice = decimalToNumber(dat!.Px)
    cache.addTrade(market, isin, latestPrice, providerTime)
    logger.debug(
      { isin, latestPrice, providerTimeUnixMs: providerTime },
      'Processed single trade frame',
    )
    return { isin, providerTime }
  }
  if (hasSingleBidFrame(dat) && hasSingleOfferFrame(dat)) {
    const bidPx = decimalToNumber(dat!.Bid!.Px)
    const askPx = decimalToNumber(dat!.Offer!.Px)
    const bidSz = decimalToNumber(dat!.Bid!.Sz)
    const askSz = decimalToNumber(dat!.Offer!.Sz)
    cache.addQuote(market, isin, bidPx, askPx, providerTime, bidSz, askSz)
    logger.debug(
      { isin, bid: bidPx, ask: askPx, mid: (bidPx + askPx) / 2, providerTimeUnixMs: providerTime },
      'Processed single quote frame',
    )
    return { isin, providerTime }
  }
  if (hasSingleBidFrame(dat)) {
    const bidPx = decimalToNumber(dat!.Bid!.Px)
    const bidSz = decimalToNumber(dat!.Bid!.Sz)
    cache.addBid(market, isin, bidPx, providerTime, bidSz)
    logger.debug(
      { isin, bid: bidPx, providerTimeUnixMs: providerTime },
      'Processed single bid frame',
    )
    return { isin, providerTime }
  }

  if (hasSingleOfferFrame(dat)) {
    const askPx = decimalToNumber(dat!.Offer!.Px)
    const askSz = decimalToNumber(dat!.Offer!.Sz)
    cache.addAsk(market, isin, askPx, providerTime, askSz)
    logger.debug(
      { isin, ask: askPx, providerTimeUnixMs: providerTime },
      'Processed single offer frame',
    )
    return { isin, providerTime }
  }

  logger.debug({ isin, keys: Object.keys(dat ?? {}) }, 'Ignoring unsupported market data frame')
  return null
}

function decodeSingleMarketData(sm: StreamMessage): { market: Market; md: MarketData } | undefined {
  const msgs = sm.messages ?? []
  if (msgs.length !== 1) {
    logger.warn({ count: msgs.length }, 'Expected exactly one message in StreamMessage')
    return
  }
  const subs = sm.subs ?? ''
  let market
  if (isMarket(subs)) {
    market = subs
  } else {
    logger.error({ subs }, 'Unsupported market/stream identifier in StreamMessage.subs')
    return
  }
  const anyMsg = msgs[0]
  try {
    const md = fromBinary(MarketDataSchema, anyMsg.value)
    return { market, md }
  } catch (err) {
    logger.error({ err }, 'Failed to decode MarketData from StreamMessage')
    return
  }
}

function isMarket(x: string): x is Market {
  return (MARKETS as readonly string[]).includes(x)
}

export const lwbaProtobufWsTransport = createLwbaWsTransport((quote) => {
  if (
    quote.bid == null ||
    quote.ask == null ||
    quote.mid == null ||
    quote.bidSize == null ||
    quote.askSize == null
  ) {
    return undefined
  }

  return {
    bid: quote.bid,
    ask: quote.ask,
    mid: quote.mid,
    bidSize: quote.bidSize,
    askSize: quote.askSize,
  }
})
