import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { quote } from './endpoint'
import { config, rateLimiting } from '@chainlink/finnhub-adapter'

export const adapter = new PriceAdapter({
  defaultEndpoint: quote.name,
  name: 'FINNHUB-SECONDARY',
  config,
  endpoints: [quote],
  rateLimiting,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
