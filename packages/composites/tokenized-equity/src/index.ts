import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ondo } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: ondo.name,
  name: 'TOKENIZED_EQUITY',
  config,
  endpoints: [ondo],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
