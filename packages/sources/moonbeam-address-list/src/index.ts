import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { addressEndpoint } from './endpoint/address'

export const adapter = new PoRAdapter({
  name: 'MOONBEAM_ADDRESS_LIST',
  endpoints: [addressEndpoint],
  defaultEndpoint: addressEndpoint.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
