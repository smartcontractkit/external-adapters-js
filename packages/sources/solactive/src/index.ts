import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'SOLACTIVE',
  config,
  endpoints: [price],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 3,
        note: 'Conservative rate limit as key is shared',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
