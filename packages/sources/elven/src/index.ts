import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { hope } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: hope.name,
  name: 'ELVEN',
  config,
  endpoints: [hope],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1s: 50,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
