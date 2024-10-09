import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import includes from './config/includes.json'
import {
  crypto,
  cryptolwba,
  cryptoyield,
  cryptostate,
  eod,
  forex,
  iex,
  top,
  volatility,
  volume,
  vwap,
} from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: crypto.name,
  name: 'TIINGO',
  config,
  endpoints: [
    crypto,
    volume,
    top,
    eod,
    iex,
    forex,
    vwap,
    cryptolwba,
    cryptoyield,
    cryptostate,
    volatility,
  ],
  includes,
  rateLimiting: {
    tiers: {
      starter: {
        rateLimit1h: 41,
        note: 'Starter tier, 50 requests per hour. With a maximum of 1,000 requests per day (https://api.tiingo.com/about/pricing)',
      },
      power: {
        rateLimit1h: 2080,
        note: 'Power tier, 5,000 requests per hour. With a maximum of 50,000 requests per day (https://api.tiingo.com/about/pricing)',
      },
      commercial: {
        rateLimit1h: 6250,
        note: 'Commercial tier, 20,000 requests per hour. With a maximum of 150,000 requests per day (https://api.tiingo.com/about/pricing)',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
