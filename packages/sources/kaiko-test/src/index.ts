import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import includes from './config/includes.json'
import { trades } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: trades.name,
  name: 'KAIKO',
  endpoints: [trades],
  config,
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
