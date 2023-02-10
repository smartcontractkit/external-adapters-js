import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import overrides from './config/overrides.json'
import { crypto, volume, filtered, globalmarketcap, marketcap } from './endpoint'
import { customSettings } from './config'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'NOMICS',
  customSettings,
  endpoints: [crypto, volume, filtered, globalmarketcap, marketcap],
  overrides: overrides['nomics'],
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
