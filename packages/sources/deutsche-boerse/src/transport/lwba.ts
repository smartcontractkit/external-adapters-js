import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, Market, MARKETS } from '../endpoint/lwba'
import {
  RequestSchema,
  StreamMessageSchema,
  SubscribeSchema,
  UnsubscribeSchema,
  type StreamMessage,
} from '../gen/client_pb'
import { MarketDataSchema, type MarketData } from '../gen/md_cef_pb'
import { InstrumentQuoteCache } from './instrument-quote-cache'
import {
  decimalToNumber,
  hasSingleBidFrame,
  hasSingleOfferFrame,
  isSingleTradeFrame,
  parseIsin,
  pickProviderTime,
} from './proto-utils'
import { ProtobufWsTransport } from './protobuf-wstransport'

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Buffer
  }
}

const logger = makeLogger('DeutscheBoerseTransport')

export function createLwbaWsTransport() {
  const cache = new InstrumentQuoteCache()
  const transport = new ProtobufWsTransport<WsTransportTypes>({
    url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/stream?format=proto`,
    options: async (context) => ({
      headers: { 'X-API-Key': context.adapterSettings.API_KEY },
      followRedirects: true,
    }),
    handlers: {
      open: () => {
        logger.info('LWBA websocket connection established')
      },
      error: (errorEvent) => {
        logger.error({ errorEvent }, 'LWBA websocket error')
      },
      close: (closeEvent) => {
        const code = (closeEvent as any)?.code
        const reason = (closeEvent as any)?.reason
        const wasClean = (closeEvent as any)?.wasClean
        logger.info({ code, reason, wasClean }, 'LWBA websocket closed')
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
        const result = processMarketData(md, cache)
        if (!result) {
          return []
        }
        const { isin, providerTime } = result
        const quote = cache.get(isin)
        if (quote == null) {
          logger.error({ isin, market }, 'Quote missing from cache after processing frame')
          return []
        }
        if (
          quote.mid == null ||
          quote.ask == null ||
          quote.bid == null ||
          quote.latestPrice == null ||
          quote.quoteProviderTimeUnixMs == null ||
          quote.tradeProviderTimeUnixMs == null
        ) {
          logger.error(
            { isin, market },
            'Neither mid nor latestPrice present after processing frame',
          )
          logger.debug({ isin, market }, 'Awaiting complete quote before emitting')
          return []
        }

        return [
          {
            params: { isin, market },
            response: {
              result: null,
              data: {
                mid: quote.mid,
                bid: quote.bid,
                ask: quote.ask,
                latestPrice: quote.latestPrice,
                quoteProviderIndicatedTimeUnixMs: quote.quoteProviderTimeUnixMs,
                tradeProviderIndicatedTimeUnixMs: quote.tradeProviderTimeUnixMs,
              },
              timestamps: { providerIndicatedTimeUnixMs: providerTime },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (p: { market: string; isin: string }) => {
        if (cache.isEmpty()) {
          cache.activate(p.isin)
          const req = create(RequestSchema, {
            event: 'subscribe',
            requestId: BigInt(Date.now()),
            subscribe: create(SubscribeSchema, {
              stream: [{ stream: p.market }],
            }),
          })
          logger.info(
            { isin: p.isin, market: p.market },
            'Building initial subscribe request (first instrument activates stream)',
          )
          return toBinary(RequestSchema, req)
        }
        cache.activate(p.isin)
        logger.debug(
          { isin: p.isin, market: p.market },
          'Instrument activated; stream already subscribed, no outbound subscribe message sent',
        )
        return undefined
      },

      unsubscribeMessage: (p: { market: string; isin: string }) => {
        cache.deactivate(p.isin)
        if (cache.isEmpty()) {
          const req = create(RequestSchema, {
            event: 'unsubscribe',
            requestId: BigInt(Date.now()),
            unsubscribe: create(UnsubscribeSchema, { stream: [p.market] }),
          })
          logger.info(
            { isin: p.isin, market: p.market },
            'All instruments deactivated; building unsubscribe request',
          )
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

function processMarketData(
  md: MarketData,
  cache: InstrumentQuoteCache,
): {
  isin: string
  providerTime: number
} | null {
  const isin = parseIsin(md)
  const dat: any = (md as any)?.Dat ?? {}

  if (!isin) {
    logger.warn({ md }, 'Could not parse ISIN from MarketData.Instrmt.Sym')
    return null
  }

  const quote = cache.get(isin)
  if (!quote) {
    logger.debug({ isin }, 'Ignoring message for inactive instrument (not in cache)')
    return null
  }

  const providerTime = pickProviderTime(dat)

  if (isSingleTradeFrame(dat)) {
    const latestPrice = decimalToNumber(dat.Px)
    cache.addTrade(isin, latestPrice, providerTime)
    logger.info(
      { isin, latestPrice, providerTimeUnixMs: providerTime },
      'Processed single trade frame',
    )
    return { isin, providerTime }
  }
  if (hasSingleBidFrame(dat) && hasSingleOfferFrame(dat)) {
    const bidPx = decimalToNumber(dat!.Bid!.Px)
    const askPx = decimalToNumber(dat!.Offer!.Px)
    cache.addQuote(isin, askPx, bidPx, providerTime)
    logger.info(
      { isin, bid: bidPx, ask: askPx, mid: (bidPx + askPx) / 2, providerTimeUnixMs: providerTime },
      'Processed single quote frame',
    )
    return { isin, providerTime }
  }
  if (hasSingleBidFrame(dat)) {
    const bidPx = decimalToNumber(dat!.Bid!.Px)
    cache.addBid(isin, bidPx, providerTime)
    logger.info(
      { isin, bid: bidPx, providerTimeUnixMs: providerTime },
      'Processed single bid frame',
    )
    return { isin, providerTime }
  }

  if (hasSingleOfferFrame(dat)) {
    const askPx = decimalToNumber(dat!.Offer!.Px)
    cache.addAsk(isin, askPx, providerTime)
    logger.info(
      { isin, ask: askPx, providerTimeUnixMs: providerTime },
      'Processed single offer frame',
    )
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
export const wsTransport = createLwbaWsTransport()
