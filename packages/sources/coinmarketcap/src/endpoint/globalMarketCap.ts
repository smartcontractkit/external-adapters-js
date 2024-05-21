import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { globalInputParameters } from './utils'
import { httpTransport } from '../transport/globalMarketCap'

export const endpoint = new AdapterEndpoint({
  name: 'globalmarketcap',
  transport: httpTransport,
  inputParameters: globalInputParameters,
  overrides: overrides.coinmarketcap,
})
