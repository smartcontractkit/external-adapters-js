import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { wallets } from './endpoint'

export const adapter = new Adapter({
  name: 'COPPER',
  config,
  endpoints: [wallets],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
