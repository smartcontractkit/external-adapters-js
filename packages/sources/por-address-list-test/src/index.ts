import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { address } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: address.name,
  name: 'POR-ADDRESS-LIST-TEST',
  config,
  endpoints: [address],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
