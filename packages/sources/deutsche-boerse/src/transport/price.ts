import { createLwbaWsTransport } from './wsProtobufTransportBase'

export const priceProtobufWsTransport = createLwbaWsTransport((quote) => {
  if (
    quote.latestPrice == null ||
    quote.quoteProviderTimeUnixMs == null ||
    quote.tradeProviderTimeUnixMs == null
  ) {
    return undefined
  }

  return {
    latestPrice: quote.latestPrice,
    quoteProviderIndicatedTimeUnixMs: quote.quoteProviderTimeUnixMs,
    tradeProviderIndicatedTimeUnixMs: quote.tradeProviderTimeUnixMs,
  }
})
