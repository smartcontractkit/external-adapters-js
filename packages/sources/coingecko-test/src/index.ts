import { expose } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import overrides from './config/overrides.json'
import {
  coins,
  crypto,
  cryptoVolume,
  cryptoMarketcap,
  dominance,
  globalMarketcap,
} from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: 'crypto',
  name: 'COINGECKO',
  endpoints: [crypto, coins, cryptoMarketcap, cryptoVolume, dominance, globalMarketcap],
  overrides: overrides['coingecko'],
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1s: 10,
        rateLimit1m: 50,
        note: '1s found in ToS, 1m found at https://www.coingecko.com/en/api',
      },
      analyst: {
        rateLimit1m: 500,
        rateLimit1h: 690,
      },
      chainlink: {
        rateLimit1m: 500,
        rateLimit1h: 4166,
      },
      pro: {
        rateLimit1m: 500,
        rateLimit1h: 6900,
      },
    },
  },
})

export const server = () => expose(adapter)
