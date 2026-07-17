import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { coinbase, ondo, price, robinhood, xstocks } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'TOKENIZED_EQUITY',
  config,
  endpoints: [coinbase, price, ondo, robinhood, xstocks],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
