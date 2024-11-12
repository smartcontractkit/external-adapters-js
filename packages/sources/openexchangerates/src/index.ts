import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import includes from './config/includes.json'
import { forex } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: forex.name,
  name: 'OPENEXCHANGERATES',
  config,
  endpoints: [forex],
  includes,
  rateLimiting: {
    tiers: {
      developer: {
        rateLimit1h: 13.69,
        note: 'only mentions monthly limits',
      },
      enterprise: {
        rateLimit1h: 136.9,
      },
      unlimited: {
        rateLimit1s: 100,
        rateLimit1m: 6000,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
