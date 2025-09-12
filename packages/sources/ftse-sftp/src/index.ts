import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import * as endpoints from './endpoint'

export const adapter = new Adapter({
  name: 'FTSE_SFTP',
  config,
  endpoints: [endpoints.sftp.endpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
