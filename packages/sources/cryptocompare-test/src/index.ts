import { expose } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoEndpoint } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'CRYPTOCOMPARE',
  defaultEndpoint: 'crypto',
  endpoints: [cryptoEndpoint],
})

export const server = () => expose(adapter)
