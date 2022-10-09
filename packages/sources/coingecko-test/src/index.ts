import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { expose } from '@chainlink/external-adapter-framework'
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
  name: 'coingecko',
  endpoints: [crypto, coins, cryptoMarketcap, cryptoVolume, dominance, globalMarketcap],
  overrides: overrides['coingecko'],
})

export const server = () => expose(adapter)
