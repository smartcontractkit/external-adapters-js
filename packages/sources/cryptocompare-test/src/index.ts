import { expose } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { cryptoEndpoint } from './endpoint'

export const adapter = new Adapter({
  name: 'CRYPTOCOMPARE',
  defaultEndpoint: 'crypto',
  endpoints: [cryptoEndpoint],
})

export const server = () => expose(adapter)
