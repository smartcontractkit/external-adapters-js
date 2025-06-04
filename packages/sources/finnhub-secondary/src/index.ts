import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config, rateLimiting } from '@chainlink/finnhub-adapter'
import includes from './config/includes.json'
import { marketStatus, quote } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: quote.name,
  name: 'FINNHUB-SECONDARY',
  config,
  endpoints: [quote, marketStatus],
  rateLimiting,
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
