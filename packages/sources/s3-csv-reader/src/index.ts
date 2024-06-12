import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { csv } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: csv.name,
  name: 'S3_CSV_READER',
  config,
  endpoints: [csv],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
