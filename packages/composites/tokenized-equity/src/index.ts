import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ondo, price, robinhood, xstocks } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'TOKENIZED_EQUITY',
  config,
  endpoints: [price, ondo, robinhood, xstocks],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
