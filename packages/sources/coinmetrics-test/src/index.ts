import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { priceRouter } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: priceRouter.name,
  name: 'COINMETRICS',
  endpoints: [priceRouter],
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
