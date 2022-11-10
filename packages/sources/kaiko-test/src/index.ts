import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { DEFAULT_API_ENDPOINT } from './config'
import { trades } from './endpoint'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  defaultEndpoint: 'crypto',
  name: 'KAIKO',
  endpoints: [trades],
  envDefaultOverrides: {
    API_TIMEOUT: 30000,
    API_ENDPOINT: DEFAULT_API_ENDPOINT,
  },
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
