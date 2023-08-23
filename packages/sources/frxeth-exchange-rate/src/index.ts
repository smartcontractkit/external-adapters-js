import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { crypto } from './endpoint'

export const adapter = new Adapter({
  name: 'FRXETH-EXCHANGE-RATE',
  defaultEndpoint: crypto.name,
  config,
  endpoints: [crypto],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
