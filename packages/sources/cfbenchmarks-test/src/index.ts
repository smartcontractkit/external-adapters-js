import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { CryptoPriceEndpoint, PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'CFBENCHMARKS',
  endpoints: [crypto as CryptoPriceEndpoint<any>],
  defaultEndpoint: crypto.name,
  customSettings,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
