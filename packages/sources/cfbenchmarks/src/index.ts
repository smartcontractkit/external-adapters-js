import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { crypto, cryptolwba } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'CFBENCHMARKS',
  endpoints: [crypto, cryptolwba],
  defaultEndpoint: crypto.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
