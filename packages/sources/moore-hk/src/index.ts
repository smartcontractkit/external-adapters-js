import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { trueusd } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: trueusd.name,
  name: 'MOORE-HK',
  config,
  endpoints: [trueusd],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 6,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
