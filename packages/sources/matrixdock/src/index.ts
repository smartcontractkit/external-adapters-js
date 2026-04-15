import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { endpoint as navEndpoint } from './endpoint/nav'

export const adapter = new Adapter({
  defaultEndpoint: navEndpoint.name,
  name: 'MATRIXDOCK',
  config,
  endpoints: [navEndpoint],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 5,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
