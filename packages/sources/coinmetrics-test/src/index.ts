import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { price, burned, totalBurned } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: 'price',
  name: 'COINMETRICS',
  endpoints: [price, burned, totalBurned],
  customSettings,
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
