import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto, birc } from './endpoint'
import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'

export const adapter = new Adapter({
  name: 'CFBENCHMARKS',
  endpoints: [crypto as CryptoPriceEndpoint<any>, birc],
  defaultEndpoint: crypto.name,
  customSettings,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
