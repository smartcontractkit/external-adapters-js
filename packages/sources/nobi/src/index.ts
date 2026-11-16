import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price, stock_quotes } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'NOBI',
  config,
  endpoints: [price, stock_quotes],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
