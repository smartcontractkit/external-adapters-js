import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: '21X',
  config,
  endpoints: [price],
  rateLimiting: {
    tiers: {
      default: {
        // The DP has a rate limit of 3000 per 5 minutes per IP.
        // We limit the EA to half of that to be safe.
        rateLimit1m: 300,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
