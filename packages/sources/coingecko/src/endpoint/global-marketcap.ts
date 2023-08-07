import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { transport } from '../transport/global-marketcap'
import { globalInputParameters } from './utils'
export const endpoint = new AdapterEndpoint({
  name: 'globalmarketcap',
  aliases: ['total_market_cap'],
  transport,
  inputParameters: globalInputParameters,
  overrides: overrides.coingecko,
})
