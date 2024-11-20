import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { balanceEndpoint } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: balanceEndpoint.name,
  name: 'ETH_BALANCE',
  config,
  endpoints: [balanceEndpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
