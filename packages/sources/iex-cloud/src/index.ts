import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { crypto, eod, stock } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: stock.name,
  name: 'IEXCLOUD',
  config,
  endpoints: [crypto, stock, eod],
  rateLimiting: {
    tiers: {
      individual: {
        rateLimit1h: 6944.44444444,
        note: 'only mentions monthly limit',
      },
      business: {
        rateLimit1h: 208333.333333,
        note: 'only mentions monthly limit',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
