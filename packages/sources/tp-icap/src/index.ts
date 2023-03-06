import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter, PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { priceEndpoint } from './endpoint'
import { customSettings } from './config'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  name: 'TP_ICAP',
  defaultEndpoint: 'price',
  customSettings,
  endpoints: [priceEndpoint as PriceEndpoint<any>],
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
