import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { burned, priceRouter, totalBurned } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: priceRouter.name,
  name: 'COINMETRICS',
  config,
  endpoints: [priceRouter, totalBurned, burned],
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
