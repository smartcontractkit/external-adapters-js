import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { addressEndpoint } from './endpoint/address'

export const adapter = new Adapter({
  name: 'MOONBEAM_ADDRESS_LIST',
  endpoints: [addressEndpoint],
  defaultEndpoint: addressEndpoint.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
