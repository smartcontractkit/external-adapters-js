import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { crypto, vwap, volume, marketcap } from './endpoint'
import { config } from './config'

export const adapter = new PriceAdapter({
  name: 'CRYPTOCOMPARE',
  defaultEndpoint: 'crypto',
  config,
  endpoints: [crypto, vwap, volume, marketcap],
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1h: 136.98,
      },
      professional: {
        rateLimit1h: 342.46,
      },
      corporate: {
        rateLimit1h: 1027.39,
      },
      'enterprise-lite': {
        rateLimit1h: 2083,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
