import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { lwbaLatestPrice, lwbaMetadata } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: lwbaLatestPrice.name,
  name: 'DEUTSCHE_BOERSE',
  config,
  endpoints: [lwbaMetadata, lwbaLatestPrice],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
