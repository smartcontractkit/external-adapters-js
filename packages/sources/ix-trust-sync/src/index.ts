import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { trust } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: 'trust',
  name: 'IX_TRUST_SYNC',
  endpoints: [trust],
  config,
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 2,
        note: 'Turso DB query limited to 1 request per 30 seconds',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
