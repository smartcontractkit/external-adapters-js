import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { transport } from '../transport/volume'
import { inputParameters } from './utils'

export const endpoint = new PriceEndpoint({
  name: 'volume',
  transport,
  inputParameters,
  overrides: overrides.tiingo,
})
