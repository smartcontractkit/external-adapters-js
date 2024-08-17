import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { marketStatus } from './endpoint'
import { bootstrapDependencies } from './transport/market-status'

const dependencies = {}

export const adapter = new Adapter({
  name: 'MARKET_STATUS',
  endpoints: [marketStatus],
  defaultEndpoint: marketStatus.name,
  config,
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 1,
      },
    },
  },
  bootstrap: async (adp: Adapter) => bootstrapDependencies(adp, dependencies),
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter, dependencies)
