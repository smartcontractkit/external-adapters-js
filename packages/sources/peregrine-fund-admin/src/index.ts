import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav, reserve } from './endpoint'

export const adapter = new Adapter({
  //Requests will direct to this endpoint if the `endpoint` input parameter is not specified.
  defaultEndpoint: nav.name,
  // Adapter name
  name: 'PEREGRINE_FUND-ADMIN',
  // Adapter configuration (environment variables)
  config,
  // List of supported endpoints
  endpoints: [nav, reserve],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
