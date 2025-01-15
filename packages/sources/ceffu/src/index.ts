import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { solv } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: solv.name,
  name: 'CEFFU',
  config,
  endpoints: [solv],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
