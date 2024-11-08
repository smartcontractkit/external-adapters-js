import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { address } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: address.name,
  name: 'POR_ADDRESS_LIST_API',
  config,
  endpoints: [address],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
