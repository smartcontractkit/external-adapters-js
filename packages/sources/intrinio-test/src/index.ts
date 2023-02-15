import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { price } from './endpoint'
import { customSettings } from './config'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'INTRINIO',
  customSettings,
  endpoints: [price],
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1s: 100,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
