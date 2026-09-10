import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { marketStatus } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: marketStatus.name,
  name: 'STATIC_MARKET_HOURS',
  config,
  endpoints: [marketStatus],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
