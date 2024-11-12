import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/volume'
import { cryptoInputParams } from './utils'
export const endpoint = new PriceEndpoint({
  name: 'volume',
  transport: httpTransport,
  inputParameters: cryptoInputParams,
  overrides: overrides.cryptocompare,
})
