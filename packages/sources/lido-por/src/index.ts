import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reserve } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reserve.name,
  name: 'LIDO_POR',
  config,
  endpoints: [reserve],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
