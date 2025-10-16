import { createLwbaWsTransport } from '../transport/lwba'

export const lwbaLatestPriceProtobufWsTransport = createLwbaWsTransport((quote) => {
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
