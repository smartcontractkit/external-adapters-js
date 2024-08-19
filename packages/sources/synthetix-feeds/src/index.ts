import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'SYNTHETIX_FEEDS',
  config,
  endpoints: [price],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
