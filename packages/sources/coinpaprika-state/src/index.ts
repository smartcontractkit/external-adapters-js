import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { coinpaprikaState } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: coinpaprikaState.name,
  name: 'COINPAPRIKA_STATE',
  config,
  endpoints: [coinpaprikaState],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
