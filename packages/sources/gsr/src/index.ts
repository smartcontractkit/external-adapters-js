import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: 'price',
  name: 'GSR',
  endpoints: [price],
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
