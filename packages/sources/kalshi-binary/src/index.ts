import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { market } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: market.name,
  name: 'KALSHI_BINARY',
  config,
  endpoints: [market],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 600,
        note: 'Kalshi API rate limit: 10 requests per second',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
