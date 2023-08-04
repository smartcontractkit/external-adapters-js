import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { getgrambalances } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: getgrambalances.name,
  name: 'GRAMCHAIN-TEST',
  config,
  endpoints: [getgrambalances],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
