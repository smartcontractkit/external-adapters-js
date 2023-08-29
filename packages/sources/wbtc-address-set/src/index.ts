import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { addresses, members } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: addresses.name,
  name: 'WBTC',
  config,
  endpoints: [addresses, members],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
