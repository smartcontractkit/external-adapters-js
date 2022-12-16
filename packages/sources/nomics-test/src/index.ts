import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import overrides from './config/overrides.json'
import rateLimits from './config/limits.json'
import { crypto, volume, filtered, globalmarketcap, marketcap } from './endpoint'
import { customSettings } from './config'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'NOMICS',
  customSettings,
  endpoints: [crypto, volume, filtered, globalmarketcap, marketcap],

  overrides: overrides['nomics'],
  rateLimiting: {
    tiers: rateLimits,
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
