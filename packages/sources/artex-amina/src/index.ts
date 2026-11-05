import { expose, type ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { por } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: por.name,
  name: 'ARTEX_AMINA',
  config,
  endpoints: [por],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
