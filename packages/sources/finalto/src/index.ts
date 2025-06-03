import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import includes from './config/includes.json'
import { quote } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: quote.name,
  name: 'FINALTO',
  config,
  endpoints: [quote],
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
