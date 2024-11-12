import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/marketcap'
import { cryptoInputParams } from './utils'
export const endpoint = new PriceEndpoint({
  name: 'marketcap',
  transport: httpTransport,
  inputParameters: cryptoInputParams,
  overrides: overrides.cryptocompare,
})
