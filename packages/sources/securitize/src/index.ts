import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'SECURITIZE',
  config,
  endpoints: [nav],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 30,
        note: '500/minute but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
