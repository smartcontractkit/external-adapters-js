import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { config } from './config'
import { balance, wallet } from './endpoint'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'

export const adapter = new PoRAdapter({
  defaultEndpoint: balance.name,
  name: 'COINBASE_PRIME',
  config,
  endpoints: [balance, wallet],
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
