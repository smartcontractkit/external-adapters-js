import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { priceEndpoint } from './endpoint'
import { config } from './config'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  name: 'ICAP',
  defaultEndpoint: 'price',
  config: config,
  endpoints: [priceEndpoint],
  includes: includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
