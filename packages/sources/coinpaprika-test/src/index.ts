import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import overrides from './config/overrides.json'
import {
  coins,
  dominance,
  globalmarketcap,
  crypto_single,
  crypto,
  crypto_volume,
  crypto_market_cap,
  vwap,
} from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: 'crypto',
  name: 'COINPAPRIKA',
  overrides: overrides['coinpaprika'],
  // rateLimiting: {
  //   tiers: {
  //     "free": {
  //       "rateLimit1s": 10,
  //       "rateLimit1h": 69.44,
  //       "note": "50k/mo for free"
  //     },
  //     "pro": {
  //       "rateLimit1s": 10,
  //       "rateLimit1h": 347.22,
  //       "note": "250k/mo for pro"
  //     },
  //     "business": {
  //       "rateLimit1s": 10,
  //       "rateLimit1h": 1388.888,
  //       "note": "1mil/mo for business"
  //     },
  //     "enterprise": {
  //       "rateLimit1s": 10,
  //       "note": "unlimited per month"
  //     }
  //   }
  // },
  endpoints: [
    coins,
    dominance,
    globalmarketcap,
    crypto_single,
    crypto,
    crypto_volume,
    crypto_market_cap,
    vwap,
  ],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
