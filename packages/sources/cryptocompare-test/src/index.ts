import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoEndpoint } from './endpoint'
import { customSettings, defaultEndpoint } from './config'
import overrides from './config/overrides.json'

export const adapter = new PriceAdapter({
  name: 'CRYPTOCOMPARE',
  defaultEndpoint,
  endpoints: [cryptoEndpoint],
  customSettings,
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
  overrides: overrides.cryptocompare,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
