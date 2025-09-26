import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { nav, reserve } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reserve.name,
  name: 'ASSETO_FINANCE',
  config,
  endpoints: [reserve, nav],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
