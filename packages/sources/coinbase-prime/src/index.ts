import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { balance } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: balance.name,
  name: 'COINBASE-PRIME',
  config,
  endpoints: [balance],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 25,
        note: 'Using the most restrictive rate limit. Docs: IP address at 100 requests per second (rps). Portfolio ID at 25 rps with a burst of 50 rps.',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
