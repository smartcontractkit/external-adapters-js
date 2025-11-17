import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { accruedInterest } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: accruedInterest.name,
  name: 'HASTRA',
  config,
  endpoints: [accruedInterest],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 20,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
