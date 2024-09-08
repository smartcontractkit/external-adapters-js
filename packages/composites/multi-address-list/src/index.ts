import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { config } from './config'
import { address_list } from './endpoint'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'

export const adapter = new PoRAdapter({
  defaultEndpoint: address_list.name,
  name: 'MULTI_ADDRESS_LIST',
  config,
  endpoints: [address_list],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
