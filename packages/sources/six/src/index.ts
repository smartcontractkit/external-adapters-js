import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { marketStatus, price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'SIX',
  config,
  endpoints: [marketStatus, price],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
