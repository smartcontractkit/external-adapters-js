import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { state } from './endpoint'

export const adapter = new Adapter({
  name: 'BLOCKSIZE_CAPITAL_STATE',
  defaultEndpoint: 'state',
  config,
  endpoints: [state],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 60,
        note: 'Default rate limit for Blocksize-Capital state data',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
