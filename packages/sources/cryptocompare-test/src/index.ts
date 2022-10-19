import { expose } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoEndpoint, cryptoWsEndpoint } from './endpoint'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { defaultEndpoint } from './config'
import overrides from './config/overrides.json'

export const adapter = new PriceAdapter<SettingsMap>({
  name: 'CRYPTOCOMPARE',
  defaultEndpoint,
  endpoints: [cryptoEndpoint, cryptoWsEndpoint],
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
  overrides: overrides['cryptocompare'],
})

export const server = () => expose(adapter)
