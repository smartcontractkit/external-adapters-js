import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'ONRE',
  config,
  endpoints: [nav],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 2,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
