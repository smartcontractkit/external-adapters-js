import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { conversion, tickers } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: tickers.name,
  name: 'POLYGON',
  config,
  endpoints: [tickers, conversion],
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1m: 5,
        note: 'only mentions monthly limits',
      },
      starter: {
        rateLimit1h: -1,
      },
      developer: {
        rateLimit1h: -1,
      },
      advanced: {
        rateLimit1h: -1,
      },
      enterprise: {
        rateLimit1h: -1,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
