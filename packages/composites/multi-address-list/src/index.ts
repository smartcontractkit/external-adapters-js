import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { address, addressDebug } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: address.name,
  name: 'MULTI_ADDRESS_LIST',
  config,
  endpoints: [address, addressDebug],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
