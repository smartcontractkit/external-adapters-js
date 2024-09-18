import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { balance } from './endpoint'

export const adapter = new Adapter({
  //Requests will direct to this endpoint if the `endpoint` input parameter is not specified.
  defaultEndpoint: balance.name,
  // Adapter name
  name: 'ETH_BALANCES_BATCH',
  // Adapter configuration (environment variables)
  config,
  // List of supported endpoints
  endpoints: [balance],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
