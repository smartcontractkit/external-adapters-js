import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ondo, price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'TOKENIZED_EQUITY',
  config,
  endpoints: [price, ondo],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
