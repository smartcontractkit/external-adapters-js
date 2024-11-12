import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { getgrambalances } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: getgrambalances.name,
  name: 'GRAMCHAIN',
  config,
  endpoints: [getgrambalances],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 5,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
