import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { mco2, stbt } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: mco2.name,
  name: 'ARMANINO',
  config,
  endpoints: [mco2, stbt],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
