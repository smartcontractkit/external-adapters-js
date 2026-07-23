import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { stock } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: stock.name,
  name: 'TICKERLAYER',
  config,
  endpoints: [stock],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
