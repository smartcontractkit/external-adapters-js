import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { totalReserve } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: totalReserve.name,
  name: 'EXCHANGE_COPTER',
  config,
  endpoints: [totalReserve],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 30,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
