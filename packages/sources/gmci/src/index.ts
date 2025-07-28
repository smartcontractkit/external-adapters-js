import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price, wintermute } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'GMCI',
  config,
  endpoints: [price, wintermute],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
