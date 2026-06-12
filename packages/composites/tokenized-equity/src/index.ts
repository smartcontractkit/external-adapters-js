import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ondo, price, robinhood } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'TOKENIZED_EQUITY',
  config,
  endpoints: [price, ondo, robinhood],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
