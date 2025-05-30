import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { cryptoLwba } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: cryptoLwba.name,
  name: 'COINMETRICS_LWBA',
  config,
  endpoints: [cryptoLwba],
  rateLimiting: {
    tiers: {
      community: {
        rateLimit1m: 100,
      },
      paid: {
        rateLimit1s: 300,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
