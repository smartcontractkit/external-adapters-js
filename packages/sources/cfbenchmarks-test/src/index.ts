import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { birc, crypto, cryptolwba } from './endpoint'

export const adapter = new Adapter({
  name: 'CFBENCHMARKS',
  endpoints: [crypto, birc, cryptolwba],
  defaultEndpoint: crypto.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
