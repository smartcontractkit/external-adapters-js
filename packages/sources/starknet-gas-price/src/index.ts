import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { gasprice } from './endpoint'

export const adapter = new Adapter({
  //Requests will direct to this endpoint if the `endpoint` input parameter is not specified.
  defaultEndpoint: gasprice.name,
  // Adapter name
  name: 'STARKNET_GAS_PRICE',
  // Adapter configuration (environment variables)
  config,
  // List of supported endpoints
  endpoints: [gasprice],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
