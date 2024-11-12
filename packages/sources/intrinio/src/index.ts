import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { price } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'INTRINIO',
  config,
  endpoints: [price],
  rateLimiting: {
    tiers: {
      bronze: {
        rateLimit1m: 300,
      },
      chainlink: {
        rateLimit1m: 600,
      },
      silver: {
        rateLimit1m: 2000,
      },
      gold: {
        rateLimit1m: 2000,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
