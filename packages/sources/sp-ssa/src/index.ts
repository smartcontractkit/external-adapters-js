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
        note: 'The S&P API accepts 300 requests each minute for one apikey',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
