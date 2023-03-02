import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { CryptoPriceEndpoint, PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { price } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'BLOCKSIZECAPITAL',
  endpoints: [price as CryptoPriceEndpoint<any>],
  defaultEndpoint: price.name,
  customSettings,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
