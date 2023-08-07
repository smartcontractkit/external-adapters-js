import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { balanceEndpoint } from './endpoint/balance'

export const adapter = new Adapter({
  name: 'POLKADOT_BALANCE',
  endpoints: [balanceEndpoint],
  defaultEndpoint: balanceEndpoint.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
