import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { crypto, dominance, globalMarketCap, historical } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'COINMARKETCAP',
  config,
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1m: 7.5,
        rateLimit1h: 3,
        note: "10k credits/month, 730h in a month, ignoring daily limits since they're soft caps. Divided by 4 to account for multiple credits per request",
      },
      hobbyist: {
        rateLimit1m: 7.5,
        rateLimit1h: 13,
      },
      startup: {
        rateLimit1m: 7.5,
        rateLimit1h: 41,
      },
      standard: {
        rateLimit1m: 15,
        rateLimit1h: 171,
      },
      professional: {
        rateLimit1m: 22.5,
        rateLimit1h: 1027,
      },
    },
  },
  endpoints: [globalMarketCap, dominance, historical, crypto],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
