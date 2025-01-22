import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { reservesStaging, reservesTest } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: reservesStaging.name,
  name: 'BITGO_RESERVES-TEST',
  config,
  endpoints: [reservesStaging, reservesTest],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
