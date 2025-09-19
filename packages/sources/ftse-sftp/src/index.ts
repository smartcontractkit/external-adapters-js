import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { sftp } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: sftp.name,
  name: 'FTSE_SFTP',
  config,
  endpoints: [sftp],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
