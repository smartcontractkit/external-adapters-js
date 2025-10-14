import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { lwba } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: lwba.name,
  name: 'DEUTSCHE_BOERSE',
  config,
  endpoints: [lwba],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
