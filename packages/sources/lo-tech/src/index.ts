import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { stock_quotes } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: stock_quotes.name,
  name: 'LO_TECH',
  config,
  endpoints: [stock_quotes],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
