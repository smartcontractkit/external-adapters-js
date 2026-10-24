import { expose, type ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { endpoint as nav } from './endpoint/nav'
import { endpoint as por } from './endpoint/por'

export const adapter = new Adapter({
  defaultEndpoint: nav.name,
  name: 'SPIRO',
  config,
  endpoints: [nav, por],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
