import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { price } from './endpoint'
import { config } from './config'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  name: 'TRADINGECONOMICS',
  endpoints: [price],
  defaultEndpoint: price.name,
  config,
  includes,
  rateLimiting: {
    tiers: {
      standard: {
        rateLimit1s: 1,
        rateLimit1h: 500,
        note: 'http://api.tradingeconomics.com/documentation/Limits',
      },
      professional: {
        rateLimit1s: 1,
        rateLimit1h: 800,
      },
      enterprise: {
        rateLimit1s: 1,
        rateLimit1h: 100,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
