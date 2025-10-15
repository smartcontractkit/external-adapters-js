import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, Market, MARKETS } from '../endpoint/latest-price'
import {
  RequestSchema,
  StreamMessageSchema,
  SubscribeSchema,
  UnsubscribeSchema,
  type StreamMessage,
} from '../gen/client_pb'
import { MarketDataSchema, type MarketData } from '../gen/md_cef_pb'
import { InstrumentQuoteCache } from './instrument-quote-cache'
import { decimalToNumber, isSingleTradeFrame, parseIsin, pickProviderTime } from './proto-utils'
import { ProtobufWsTransport } from './protobuf-wstransport'

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: Buffer
  }
}

const logger = makeLogger('DeutscheBoerseLatestPriceTransport')

export function createLatestPriceWsTransport() {
  const cache = new InstrumentQuoteCache()

  return new ProtobufWsTransport<WsTransportTypes>({
    url: (context) => `${context.adapterSettings.WS_API_ENDPOINT}/stream?format=proto`,
    options: async (context) => ({
      headers: { 'X-API-Key': context.adapterSettings.API_KEY },
      followRedirects: true,
    }),
    handlers: {
      open: () => {
        logger.info('Latest Price websocket connection established')
      },
      error: (errorEvent) => {
        logger.error({ errorEvent }, 'Latest Price websocket error')
      },
      close: (closeEvent) => {
        const code = (closeEvent as any)?.code
        const reason = (closeEvent as any)?.reason
        const wasClean = (closeEvent as any)?.wasClean
        logger.info({ code, reason, wasClean }, 'Latest Price websocket closed')
      },
      message(buf) {
        logger.info(
          {
            payloadType: Buffer.isBuffer(buf) ? 'buffer' : typeof buf,
            byteLength: Buffer.isBuffer(buf) ? buf.byteLength : undefined,
            rawBuffer: Buffer.isBuffer(buf) ? buf.toString('hex').substring(0, 200) : 'N/A',
          },
          'Latest Price websocket message received (RAW)',
        )

        const sm = decodeStreamMessage(buf)
        if (!sm) {
          logger.warn('Failed to decode StreamMessage')
          return []
        }

        logger.info(
          {
            subs: sm.subs,
            messageCount: sm.messages?.length || 0,
            streamMessageKeys: Object.keys(sm),
          },
          'Decoded StreamMessage',
        )

        const decoded = decodeSingleMarketData(sm)

        if (!decoded) {
          logger.warn('Failed to decode MarketData from StreamMessage')
          return []
        }
        const { market, md } = decoded

        logger.info(
          {
            market,
            md: JSON.stringify(
              md,
              (_, value) => (typeof value === 'bigint' ? value.toString() : value),
              2,
            ),
            mdKeys: Object.keys(md as any),
            mdValues: Object.values(md as any),
          },
          'Decoded MarketData from StreamMessage',
        )

        const result = processMarketDataForLatestPrice(md, market, cache)
        if (!result) {
          return []
        }
        const { isin } = result
        const quote = cache.get(isin, market)
        if (quote == null) {
          logger.error({ isin, market }, 'Quote missing from cache after processing frame')
          return []
        }

        // For latest price endpoint, we only need trade data (latestPrice)
        if (quote.latestPrice == null || quote.tradeProviderTimeUnixMs == null) {
          logger.debug(
            { isin, market },
            'Awaiting complete trade data before emitting latest price',
          )
          return []
        }

        return [
          {
            params: { isin, market },
            response: {
              result: null,
              data: {
                latestPrice: quote.latestPrice,
                timestamps: { providerIndicatedTimeUnixMs: quote.tradeProviderTimeUnixMs },
              },
            },
          },
        ]
      },
    },
    builders: {
      subscribeMessage: (p: { market: string; isin: string }) => {
        if (cache.isEmpty()) {
          cache.activate(p.isin, p.market)
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
        cache.activate(p.isin, p.market)
        logger.debug(
          { isin: p.isin, market: p.market },
          'Instrument activated; stream already subscribed, no outbound subscribe message sent',
        )
        return undefined
      },

      unsubscribeMessage: (p: { market: string; isin: string }) => {
        cache.deactivate(p.isin, p.market)
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

function processMarketDataForLatestPrice(
  md: MarketData,
  market: string,
  cache: InstrumentQuoteCache,
): {
  isin: string
  providerTime: number
} | null {
  // Log the full MarketData object with all its properties
  logger.info(
    {
      md: JSON.stringify(
        md,
        (_, value) => (typeof value === 'bigint' ? value.toString() : value),
        2,
      ),
      mdKeys: Object.keys(md as any),
      mdTypeName: (md as any).$typeName,
      msgTyp: (md as any).MsgTyp,
    },
    'Full MarketData structure received',
  )

  const isin = parseIsin(md)
  const dat: any = (md as any)?.Dat ?? {}

  if (!isin) {
    logger.warn({ md }, 'Could not parse ISIN from MarketData.Instrmt.Sym')
    return null
  }

  const quote = cache.get(isin, market)
  if (!quote) {
    logger.debug({ isin, market }, 'Ignoring message for inactive instrument (not in cache)')
    return null
  }

  logger.debug({ isin, market, dat }, 'Processing market data frame for latest price')

  const providerTime = pickProviderTime(dat)

  // For latest price endpoint, we only process trade frames (ignore quote frames)
  if (isSingleTradeFrame(dat)) {
    // Special case for md-tradegate: use AvgPx instead of Px
    const priceField = market === 'md-tradegate' ? dat.AvgPx : dat.Px
    const latestPrice = decimalToNumber(priceField)
    cache.addTrade(isin, market, latestPrice, providerTime)
    logger.debug(
      {
        isin,
        market,
        latestPrice,
        providerTimeUnixMs: providerTime,
        priceSource: market === 'md-tradegate' ? 'AvgPx' : 'Px',
      },
      'Processed single trade frame for latest price',
    )
    return { isin, providerTime }
  }

  logger.debug(
    { isin, market, keys: Object.keys(dat ?? {}) },
    'Ignoring non-trade frame for latest price endpoint',
  )
  return null
}

function decodeSingleMarketData(sm: StreamMessage): { market: Market; md: MarketData } | undefined {
  const msgs = sm.messages ?? []
  logger.info(
    {
      messageCount: msgs.length,
      subs: sm.subs,
      streamMessageKeys: Object.keys(sm),
      firstMessageKeys: msgs[0] ? Object.keys(msgs[0]) : [],
      firstMessageValueLength: msgs[0]?.value?.length,
    },
    'Processing StreamMessage in decodeSingleMarketData',
  )

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

  logger.info(
    {
      anyMsgKeys: Object.keys(anyMsg),
      anyMsgTypeUrl: anyMsg.typeUrl,
      anyMsgValueLength: anyMsg.value?.length,
      anyMsgValueHex: anyMsg.value
        ? Buffer.from(anyMsg.value).toString('hex').substring(0, 100)
        : 'N/A',
    },
    'About to decode MarketData from Any message',
  )

  try {
    const md = fromBinary(MarketDataSchema, anyMsg.value)

    logger.info(
      {
        decodedMdKeys: Object.keys(md as any),
        decodedMdEntries: Object.entries(md as any),
        hasInstrmt: !!(md as any).Instrmt,
        hasDat: !!(md as any).Dat,
        msgTyp: (md as any).MsgTyp,
      },
      'Successfully decoded MarketData',
    )

    return { market, md }
  } catch (err) {
    logger.error({ err }, 'Failed to decode MarketData from StreamMessage')
    return
  }
}

function isMarket(x: string): x is Market {
  return (MARKETS as readonly string[]).includes(x)
}

export const wsTransport = createLatestPriceWsTransport()
