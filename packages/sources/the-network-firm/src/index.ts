import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { backed, mco2, stbt, usdr } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: mco2.name,
  name: 'THE_NETWORK_FIRM',
  config,
  endpoints: [mco2, stbt, backed, usdr],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
