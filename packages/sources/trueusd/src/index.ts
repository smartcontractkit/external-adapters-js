import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { trueusd } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: trueusd.name,
  name: 'TRUEUSD',
  config,
  endpoints: [trueusd],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 5,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
