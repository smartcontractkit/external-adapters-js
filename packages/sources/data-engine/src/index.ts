import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { cryptoV3, rwaV8 } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: cryptoV3.name,
  name: 'DATA_ENGINE',
  config,
  endpoints: [cryptoV3, rwaV8],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)

export { getCryptoPrice, getRwaPrice } from './lib'
