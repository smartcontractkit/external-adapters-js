import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import includes from './config/includes.json'
import { priceEndpoint } from './endpoint'

// test change to trigger soak testing - TODO remove

export const adapter = new PriceAdapter({
  name: 'OANDA',
  defaultEndpoint: 'price',
  config,
  endpoints: [priceEndpoint],
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
