import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { glvLwbaEndpoint, glvPriceEndpoint, gmPriceEndpoint } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: gmPriceEndpoint.name,
  name: 'GMX_TOKENS',
  config,
  endpoints: [gmPriceEndpoint, glvPriceEndpoint, glvLwbaEndpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
