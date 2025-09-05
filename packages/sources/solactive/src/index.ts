import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'SOLACTIVE',
  config,
  endpoints: [nav],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 12,
        note: 'Conservative rate limit as key is shared',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
