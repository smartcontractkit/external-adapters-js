import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { birc, crypto } from './endpoint'

export const adapter = new Adapter({
  name: 'CFBENCHMARKS',
  endpoints: [crypto, birc],
  defaultEndpoint: crypto.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
