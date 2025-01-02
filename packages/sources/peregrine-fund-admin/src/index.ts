import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav, reserve } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'PEREGRINE_FUND_ADMIN',
  config,
  endpoints: [nav, reserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 30,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
