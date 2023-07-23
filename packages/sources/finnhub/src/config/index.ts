import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://finnhub.io/api/v1',
  },
  API_KEY: {
    description: 'A Finnhub API key ',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'The WS URL to retrieve data from',
    type: 'string',
    default: 'wss://ws.finnhub.io',
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
})

// Details that differ depending on which exchange data is being fetched
// Finnhub separates the Pair symbols by a different character depending on exchange. E.g. "FHFX:EUR-USD" or "OANDA:EUR_USD"
export const exchanges: Record<string, { pairDelimiter: string }> = {
  FHFX: { pairDelimiter: '-' },
  OANDA: { pairDelimiter: '_' },
  FXCM: { pairDelimiter: '/' },
}
