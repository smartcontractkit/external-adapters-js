import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from './config'
import { reserves } from './endpoint'

export const adapter = new PoRAdapter({
  defaultEndpoint: reserves.name,
  name: 'ARTEX_AMINA',
  config,
  endpoints: [reserves],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
