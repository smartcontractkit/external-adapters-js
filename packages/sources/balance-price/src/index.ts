import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price, balance } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'BALANCE_PRICE',
  config,
  endpoints: [price, balance],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
