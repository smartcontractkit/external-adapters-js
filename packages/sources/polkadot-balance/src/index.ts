import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { balanceEndpoint } from './endpoint/balance'

export const adapter = new Adapter({
  name: 'POLKADOT_BALANCE',
  endpoints: [balanceEndpoint],
  defaultEndpoint: balanceEndpoint.name,
  customSettings,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
