import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { state } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'BLOCKSIZE_CAPITAL_STATE',
  defaultEndpoint: state.name,
  config,
  endpoints: [state],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
