import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import includes from './config/includes.json'
import { price } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: price.name,
  name: 'ICE',
  config,
  endpoints: [price],
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
