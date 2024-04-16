import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { vaults } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: vaults.name,
  name: 'DLC_BTC_VAULT_DATA',
  config,
  endpoints: [vaults],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
