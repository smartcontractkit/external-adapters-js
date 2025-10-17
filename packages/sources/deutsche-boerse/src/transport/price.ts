import { createLwbaWsTransport } from './lwba'

export const priceProtobufWsTransport = createLwbaWsTransport((quote) => {
  if (quote.latestPrice == null) {
    return undefined
  }

  return {
    latestPrice: quote.latestPrice,
  }
})
