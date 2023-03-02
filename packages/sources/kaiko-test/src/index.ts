import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter, PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { trades } from './endpoint'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  defaultEndpoint: trades.name,
  name: 'KAIKO',
  endpoints: [trades as PriceEndpoint<any>],
  customSettings,
  envDefaultOverrides: {
    API_TIMEOUT: 30000,
  },
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
