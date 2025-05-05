import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'NAV_GENERIC',
  config,
  endpoints: [nav],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 20,
        note: 'Slower than API limit of 1/s',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
