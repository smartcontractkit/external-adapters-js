import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { forex } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: forex.name,
  name: 'ALPHAVANTAGE',
  config,
  endpoints: [forex],
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1m: 5,
        rateLimit1h: 20.83,
      },
      '49.99': {
        rateLimit1m: 75,
      },
      '99.99': {
        rateLimit1m: 150,
      },
      '149.99': {
        rateLimit1m: 300,
      },
      '199.99': {
        rateLimit1m: 600,
      },
      '249.99': {
        rateLimit1m: 1200,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
