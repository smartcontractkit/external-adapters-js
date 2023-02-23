import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { priceEndpoint } from './endpoint'
import { customSettings } from './config'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  name: 'OANDA',
  defaultEndpoint: 'price',
  customSettings,
  endpoints: [priceEndpoint],
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
