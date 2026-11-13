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
        rateLimit1m: 10,
        note: 'The provider hard cap is 300/min per apikey per environment, shared across all DON nodes. The 10/min tier is a safe per-process share for up to 30 processes; set RATE_LIMIT_CAPACITY_MINUTE to floor(300 / instances). The burst strategy lets the token and first data call run immediately on a cold start and can cluster up to 10 requests at a minute boundary, so the deployment must size for that window.',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
