import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { endpoint } from './endpoint/price'

export const adapter = new Adapter({
  defaultEndpoint: endpoint.name,
  name: 'SIX',
  config,
  endpoints: [endpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
