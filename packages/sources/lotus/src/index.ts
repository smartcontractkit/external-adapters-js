import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { config } from './config'
import { balance } from './endpoint'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'

export const adapter = new PoRAdapter({
  defaultEndpoint: balance.name,
  name: 'LOTUS',
  config,
  endpoints: [balance],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
