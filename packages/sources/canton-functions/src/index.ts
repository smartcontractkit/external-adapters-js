import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { cantonData } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: cantonData.name,
  name: 'CANTON_FUNCTIONS',
  config,
  endpoints: [cantonData],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
