import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { crypto, volume, filtered, globalmarketcap, marketcap } from './endpoint'
import { config } from './config'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'NOMICS',
  config,
  endpoints: [crypto, volume, filtered, globalmarketcap, marketcap],
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1s: 2,
        rateLimit1m: 60,
        note: '1 req/s, presumably allows for bursts',
      },
      paid: {
        rateLimit1s: 100,
        rateLimit1m: 6000,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
