import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'ONDO',
  config,
  endpoints: [price],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 2, // setting a rate limit so we don't go over per-key limits
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
