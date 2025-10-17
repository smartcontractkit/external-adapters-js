import { createLwbaWsTransport } from './wsProtobufTransportBase'

export const lwbaProtobufWsTransport = createLwbaWsTransport((quote) => {
  if (
    quote.bid == null ||
    quote.ask == null ||
    quote.mid == null ||
    quote.quoteProviderTimeUnixMs == null ||
    quote.tradeProviderTimeUnixMs == null
  ) {
    return undefined
  }

  return {
    bid: quote.bid,
    ask: quote.ask,
    mid: quote.mid,
    bidSize: quote.bidSize ?? null,
    askSize: quote.askSize ?? null,
    quoteProviderIndicatedTimeUnixMs: quote.quoteProviderTimeUnixMs,
    tradeProviderIndicatedTimeUnixMs: quote.tradeProviderTimeUnixMs,
  }
})
