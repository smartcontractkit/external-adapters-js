import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

import { config } from './config/config'
import { nav } from './endpoint/nav'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'LIVE_ART_NAV',
  config,
  endpoints: [nav],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 60,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
