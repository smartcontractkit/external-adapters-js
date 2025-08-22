import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { config } from './config'
import * as endpoints from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: 'sftp',
  name: 'SFTP_GENERIC',
  config,
  endpoints: [endpoints.sftp.endpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)

