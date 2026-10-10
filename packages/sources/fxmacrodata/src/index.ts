import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { forex, indicator } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: forex.name,
  name: 'FXMACRODATA',
  config,
  endpoints: [forex, indicator],
  rateLimiting: {
    tiers: {
      default: {
        rateLimit1m: 300,
        rateLimit1h: 5000,
        note: 'Per API key',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
