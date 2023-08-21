import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price, crypto_lwba } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: price.name,
  name: 'GSR',
  endpoints: [price, crypto_lwba],
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
