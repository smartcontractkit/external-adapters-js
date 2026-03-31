import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { depthEndpoints, quoteEndpoints } from './endpoint'

export const adapter = new Adapter({
  name: 'ITICK',
  config,
  endpoints: [...depthEndpoints, ...quoteEndpoints],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 60,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
