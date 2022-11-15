import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings, DEFAULT_API_ENDPOINT } from './config'
import { trades } from './endpoint'
import includes from './config/includes.json'
import overrides from './config/overrides.json'

export const adapter = new PriceAdapter({
  defaultEndpoint: trades.name,
  name: 'KAIKO',
  endpoints: [trades],
  customSettings,
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1h: -1,
        note: 'claims no rate limits',
      },
    },
  },
  envDefaultOverrides: {
    API_TIMEOUT: 10000,
    API_ENDPOINT: DEFAULT_API_ENDPOINT,
  },
  includes,
  overrides: overrides['kaiko'],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
