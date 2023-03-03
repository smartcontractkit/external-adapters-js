import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import {
  CryptoPriceEndpoint,
  PriceAdapter,
  PriceEndpoint,
} from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto, volume, top, eod, iex, forex, vwap } from './endpoint'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'TIINGO',
  customSettings,
  endpoints: [
    crypto as CryptoPriceEndpoint<any>,
    volume as PriceEndpoint<any>,
    top as PriceEndpoint<any>,
    eod,
    iex,
    forex,
    vwap as PriceEndpoint<any>,
  ],
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
