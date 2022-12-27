import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto, volume, top, eod, iex, forex, vwap } from './endpoint'
import includes from './config/includes.json'
import overrides from './config/overrides.json'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'TIINGO',
  customSettings,
  endpoints: [crypto, volume, top, eod, iex, forex, vwap],
  includes,
  overrides: overrides.tiingo,
  // rateLimiting: {
  //   tiers: {
  //     "starter": {
  //       "rateLimit1h": 500,
  //     },
  //     "power": {
  //       "rateLimit1h": 20000,
  //     },
  //     "commercial": {
  //       "rateLimit1h": 20000,
  //     }
  //   },
  // },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
