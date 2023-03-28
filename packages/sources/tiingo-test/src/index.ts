import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import includes from './config/includes.json'
import { crypto, eod, forex, iex, top, volume, vwap, cryptoyield } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'TIINGO',
  config,
  endpoints: [crypto, volume, top, eod, iex, forex, vwap, cryptoyield],
  includes,
  rateLimiting: {
    tiers: {
      starter: {
        rateLimit1h: 500,
      },
      power: {
        rateLimit1h: 20000,
      },
      commercial: {
        rateLimit1h: 20000,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
