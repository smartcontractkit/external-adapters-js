import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import {
  CryptoPriceEndpoint,
  PriceAdapter,
  PriceEndpoint,
} from '@chainlink/external-adapter-framework/adapter'
import { crypto, vwap, volume, marketcap } from './endpoint'
import { customSettings, defaultEndpoint } from './config'

export const adapter = new PriceAdapter({
  name: 'CRYPTOCOMPARE',
  defaultEndpoint,
  endpoints: [
    crypto as CryptoPriceEndpoint<any>,
    vwap as PriceEndpoint<any>,
    volume as PriceEndpoint<any>,
    marketcap as PriceEndpoint<any>,
  ],
  customSettings,
  rateLimiting: {
    tiers: {
      free: {
        rateLimit1h: 136.98,
      },
      professional: {
        rateLimit1h: 342.46,
      },
      corporate: {
        rateLimit1h: 1027.39,
      },
      'enterprise-lite': {
        rateLimit1h: 2083,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
