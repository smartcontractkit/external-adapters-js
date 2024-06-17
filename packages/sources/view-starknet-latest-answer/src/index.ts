import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { functionEndpoint } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: functionEndpoint.name,
  name: 'VIEW_STARKNET_LATEST_ANSWER',
  config,
  endpoints: [functionEndpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
