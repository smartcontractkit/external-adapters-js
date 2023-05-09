import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { price } from './endpoint'
import dxfeed from '@chainlink/dxfeed-test-adapter'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'DXFEED_SECONDARY',
  config: dxfeed.config,
  endpoints: [price],
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
