import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { calcNetShareValueInAsset } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: calcNetShareValueInAsset.name,
  name: 'NEXUS_KILN',
  config,
  endpoints: [calcNetShareValueInAsset],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
