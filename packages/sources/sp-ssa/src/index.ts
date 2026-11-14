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
        rateLimit1m: 60,
        note: 'The provider hard cap is 300/min per apikey per environment, shared across all DON nodes. This adapter ships rateLimit1m: 60 as a conservative per-process default, so up to five nodes share the cap without an override. Deployments with more than five nodes must set RATE_LIMIT_CAPACITY_MINUTE to floor(300 / instances). If the provider plus limiter period exceeds the foreground cache poll window, raise CACHE_POLLING_MAX_RETRIES and/or CACHE_POLLING_SLEEP_MS.',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
