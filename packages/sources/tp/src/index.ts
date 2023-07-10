import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { priceEndpoint } from './endpoint'
import { config } from './config'
import includes from './config/includes.json'

export * from './endpoint'
export * from './transport/price'

export const adapter = new PriceAdapter({
  name: 'TP',
  defaultEndpoint: 'price',
  config,
  endpoints: [priceEndpoint],
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)

export default {
  config,
  includes,
}
