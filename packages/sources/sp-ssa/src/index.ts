import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ssa } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: ssa.name,
  name: 'SP_SSA',
  config,
  endpoints: [ssa],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 300,
        note: 'The provider hard cap is 300/min per apikey per environment, shared across all DON nodes. This adapter ships rateLimit1m: 300 as the per-process hard ceiling; the deployment must set RATE_LIMIT_CAPACITY_MINUTE to floor(300 / instances). If the per-process rate is below 60/min, raise CACHE_POLLING_MAX_RETRIES and/or CACHE_POLLING_SLEEP_MS so the foreground cache poll window exceeds the limiter period.',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
