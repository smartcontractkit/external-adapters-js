import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { mintable } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: mintable.name,
  name: 'SECURE_MINT',
  config,
  endpoints: [mintable],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
