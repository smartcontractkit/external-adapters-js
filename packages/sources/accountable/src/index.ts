import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reserves } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reserves.name,
  name: 'ACCOUNTABLE',
  config,
  endpoints: [reserves],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 10,
        note: 'Setting rate limit based on API spec of 10 requests per second',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
