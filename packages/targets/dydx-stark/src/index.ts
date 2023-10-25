import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { send } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: send.name,
  name: 'DYDX_STARK',
  config,
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1s: 10,
        note: '100req/10s',
      },
    },
  },
  endpoints: [send],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
