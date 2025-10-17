import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { lwba, price } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: price.name,
  name: 'DEUTSCHE_BOERSE',
  config,
  endpoints: [lwba, price],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
