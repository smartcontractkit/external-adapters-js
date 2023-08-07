import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { transport } from '../transport/vwap'
import { inputParameters } from './utils'

export const endpoint = new PriceEndpoint({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport,
  inputParameters,
  overrides: overrides.tiingo,
})
