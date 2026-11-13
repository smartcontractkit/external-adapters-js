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
        note: '300/min per apikey per environment is shared across all DON nodes. Set RATE_LIMIT_CAPACITY_MINUTE to floor(300 / instances); the 10/min default is safe for up to 30 processes.',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
