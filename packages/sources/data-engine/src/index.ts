import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { cryptoV3, deutscheBoerseV11, exchangeRateV7, rwaV8, twap } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: cryptoV3.name,
  name: 'DATA_ENGINE',
  config,
  endpoints: [cryptoV3, rwaV8, deutscheBoerseV11, exchangeRateV7, twap],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)

export {
  getCryptoPrice,
  getDeutscheBoersePrice,
  getExchangeRate,
  getFeedData,
  getRwaPrice,
} from './lib'
export type { FeedDataResult } from './lib'
