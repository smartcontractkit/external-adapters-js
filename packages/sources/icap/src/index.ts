import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { priceEndpoint } from './endpoint'
import tp from '@chainlink/tp-adapter'

export const adapter = new PriceAdapter({
  name: 'ICAP',
  defaultEndpoint: 'price',
  config: tp.config,
  endpoints: [priceEndpoint],
  includes: tp.includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
