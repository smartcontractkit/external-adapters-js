import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { assets, crypto } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: crypto.name,
  name: 'COINAPI',
  config,
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1h: 4.16,
      },
      startup: {
        rateLimit1h: 41.66,
      },
      streamer: {
        rateLimit1h: 416.66,
      },
      professional: {
        rateLimit1h: 4166.66,
      },
    },
  },
  endpoints: [crypto, assets],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
