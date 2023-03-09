import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { priceRouter, lwbaRouter } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: 'price-ws',
  name: 'COINMETRICS',
  endpoints: [priceRouter, lwbaRouter],
  config,
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
