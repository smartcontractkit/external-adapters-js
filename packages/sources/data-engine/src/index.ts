import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { cryptoLwba } from './endpoint'

export const adapter = new Adapter({
  //Requests will direct to this endpoint if the `endpoint` input parameter is not specified.
  defaultEndpoint: cryptoLwba.name,
  // Adapter name
  name: 'DATA_ENGINE',
  // Adapter configuration (environment variables)
  config,
  // List of supported endpoints
  endpoints: [cryptoLwba],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
