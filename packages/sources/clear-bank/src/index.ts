import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { accounts } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: accounts.name,
  name: 'CLEAR_BANK',
  config,
  endpoints: [accounts],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 1,
        note: 'Reasonable rate limit set by default to avoid overwhelming the endpoint',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
