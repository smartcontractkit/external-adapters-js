import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reserve } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reserve.name,
  name: 'NAV_CONSULTING',
  config,
  endpoints: [reserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 20,
        note: 'Nothing in docs, setting reasonable rate limit based on 2req/bg execute',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
