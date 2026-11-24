import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { ssa } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: ssa.name,
  name: 'SPGLOBAL',
  config,
  endpoints: [ssa],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
