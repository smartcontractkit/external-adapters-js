import overrides from './config/overrides.json'
import {
  coins,
  crypto,
  cryptoVolume,
  cryptoMarketcap,
  dominance,
  globalMarketcap,
} from './endpoint'
import { expose } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'

export const adapter = new Adapter({
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

const server = () => expose(adapter)
const NAME = adapter.name //Required for legos
export { NAME, customSettings, server }
