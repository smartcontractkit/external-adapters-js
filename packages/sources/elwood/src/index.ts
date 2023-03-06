import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { CryptoPriceEndpoint, PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoEndpoint } from './endpoint'
import { customSettings } from './config'

export const adapter = new PriceAdapter({
  name: 'ELWOOD',
  defaultEndpoint: 'crypto',
  customSettings,
  endpoints: [cryptoEndpoint as CryptoPriceEndpoint<any>],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
