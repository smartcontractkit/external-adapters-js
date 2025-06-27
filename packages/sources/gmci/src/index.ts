import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price } from './endpoint'

export const adapter = new Adapter({
  //Requests will direct to this endpoint if the `endpoint` input parameter is not specified.
  defaultEndpoint: price.name,
  // Adapter name
  name: 'GMCI',
  // Adapter configuration (environment variables)
  config,
  // List of supported endpoints
  endpoints: [price],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
