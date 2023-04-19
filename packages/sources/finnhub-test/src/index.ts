import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { quote } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: quote.name,
  name: 'FINNHUB',
  config,
  endpoints: [quote],
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1m: 60,
      },
      'all-in-one': {
        rateLimit1m: 300,
        note: 'limit is for market data, not fundamental data',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
