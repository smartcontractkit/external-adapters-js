import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { cryptolwba, price, vwap } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'BLOCKSIZE_CAPITAL',
  endpoints: [price, cryptolwba, vwap],
  defaultEndpoint: price.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
