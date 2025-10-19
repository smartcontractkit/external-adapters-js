import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reserve } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reserve.name,
  name: 'STREAMEX',
  config,
  endpoints: [reserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 10, // 10 requests per minute
        rateLimit1s: 2, // 20 per 10s = ~2 per second
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
