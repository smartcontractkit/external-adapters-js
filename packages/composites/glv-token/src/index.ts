import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { lwba, price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'GLV_TOKEN',
  config,
  endpoints: [price, lwba],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
