import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { stockQuotes } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: stockQuotes.name,
  name: 'ALPACA',
  config,
  endpoints: [stockQuotes],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
