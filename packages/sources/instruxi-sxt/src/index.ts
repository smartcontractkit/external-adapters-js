import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { total_reserve } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: total_reserve.name,
  name: 'INSTRUXI_SXT',
  config,
  endpoints: [total_reserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 5,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
