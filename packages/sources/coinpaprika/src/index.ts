import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { coins, crypto, global, vwap } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'COINPAPRIKA',
  config,
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1s: 10,
        rateLimit1h: 69.44,
        note: '50k/mo for free',
      },
      pro: {
        rateLimit1s: 10,
        rateLimit1h: 347.22,
        note: '250k/mo for pro',
      },
      business: {
        rateLimit1s: 10,
        rateLimit1h: 1388.888,
        note: '1mil/mo for business',
      },
      enterprise: {
        rateLimit1s: 10,
        note: 'unlimited per month',
      },
    },
  },
  endpoints: [crypto, global, coins, vwap],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
