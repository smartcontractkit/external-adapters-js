import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { marketStatus } from './endpoint'

export const adapter = new Adapter({
  name: 'MARKET_STATUS',
  endpoints: [marketStatus],
  defaultEndpoint: marketStatus.name,
  config,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
