import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { gmci, wintermute } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: gmci.name,
  name: 'GMCI',
  config,
  endpoints: [gmci, wintermute],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
