import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { etherFi, evm, solvJlp, tbill, xrpl } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: evm.name,
  name: 'TOKEN_BALANCE',
  config,
  endpoints: [evm, solvJlp, etherFi, tbill, xrpl],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
