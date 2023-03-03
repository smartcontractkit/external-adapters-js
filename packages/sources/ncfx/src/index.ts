import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import {
  CryptoPriceEndpoint,
  PriceAdapter,
  PriceEndpoint,
} from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto, forex } from './endpoint'
import includes from './config/includes.json'

export const adapter = new PriceAdapter({
  name: 'NCFX',
  endpoints: [crypto as CryptoPriceEndpoint<any>, forex as PriceEndpoint<any>],
  defaultEndpoint: crypto.name,
  customSettings,
  includes,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
