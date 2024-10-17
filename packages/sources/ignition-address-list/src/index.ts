import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { address } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: address.name,
  name: 'IGNITION_ADDRESS_LIST',
  config,
  endpoints: [address],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
        note: 'The same IP address can only send one request within 5 seconds',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
