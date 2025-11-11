import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price, stockQuote } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'DXFEED',
  config,
  endpoints: [price, stockQuote],
  rateLimiting: {
    tiers: {
      unlimited: {
        rateLimit1s: 100,
        note: 'Dxfeed does not describe a rate limit, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
