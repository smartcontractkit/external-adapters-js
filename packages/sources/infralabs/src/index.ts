import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ushp } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: ushp.name,
  name: 'INFRALABS',
  config,
  endpoints: [ushp],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
