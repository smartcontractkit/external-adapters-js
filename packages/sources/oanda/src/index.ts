import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoEndpoint } from './endpoint'
import { customSettings } from './config'

export const adapter = new PriceAdapter({
  name: 'OANDA',
  defaultEndpoint: 'crypto',
  customSettings,
  endpoints: [cryptoEndpoint],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
