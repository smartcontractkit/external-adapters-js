import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { quotesEndpoints, stockEndpoints } from './endpoint'

export const adapter = new Adapter({
  name: 'ITICK',
  config,
  endpoints: [...stockEndpoints, ...quotesEndpoints],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 60,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
