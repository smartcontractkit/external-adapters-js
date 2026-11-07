import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { por } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: por.name,
  name: 'ARTEX_AMINA',
  config,
  endpoints: [por],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 10,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
