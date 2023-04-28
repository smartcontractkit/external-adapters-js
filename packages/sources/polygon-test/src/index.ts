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
        rateLimit1s: 100,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
      developer: {
        rateLimit1s: 100,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
      advanced: {
        rateLimit1s: 100,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
      enterprise: {
        rateLimit1s: 100,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
