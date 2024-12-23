import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { rate } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: rate.name,
  name: 'NYFED',
  config,
  endpoints: [rate],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
        note: 'Reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
