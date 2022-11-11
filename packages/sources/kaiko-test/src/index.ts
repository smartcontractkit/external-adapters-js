import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings, DEFAULT_API_ENDPOINT } from './config'
import { trades } from './endpoint'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  defaultEndpoint: trades.name,
  name: 'KAIKO',
  endpoints: [trades],
  customSettings,
  envDefaultOverrides: {
    API_TIMEOUT: 10000,
    API_ENDPOINT: DEFAULT_API_ENDPOINT,
  },
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
