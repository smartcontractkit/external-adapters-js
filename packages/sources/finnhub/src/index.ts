import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { quote, buildQuoteEndpoint } from './endpoint'
import { config } from './config'
import includes from './config/includes.json'

const rateLimiting = {
  tiers: {
    free: {
      rateLimit1m: 60,
    },
    'all-in-one': {
      rateLimit1m: 300,
      note: 'limit is for market data, not fundamental data',
    },
  },
}

const adapter = new PriceAdapter({
  defaultEndpoint: quote.name,
  name: 'FINNHUB',
  config,
  endpoints: [quote],
  rateLimiting,
  includes,
})

const server = (): Promise<ServerInstance | undefined> => expose(adapter)

export { adapter, server, config, rateLimiting, buildQuoteEndpoint }
