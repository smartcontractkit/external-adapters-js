import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { cumulativeAmount } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: cumulativeAmount.name,
  name: 'IX_TRUST-SYNC',
  config,
  endpoints: [cumulativeAmount],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
