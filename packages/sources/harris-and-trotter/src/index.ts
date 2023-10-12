import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { balance } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: balance.name,
  name: 'HARRIS-AND-TROTTER',
  config,
  endpoints: [balance],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
