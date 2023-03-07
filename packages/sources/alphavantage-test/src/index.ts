import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { adapterConfig } from './config'
import { forex } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: forex.name,
  name: 'ALPHAVANTAGE',
  config: adapterConfig,
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
