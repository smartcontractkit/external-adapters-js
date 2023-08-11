import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { balance } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: balance.name,
  name: 'AVALANCHE_PLATFORM',
  config,
  endpoints: [balance],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 5,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
