import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { generic } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: generic.name,
  name: 'GENERIC_API',
  config,
  endpoints: [generic],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 20,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
