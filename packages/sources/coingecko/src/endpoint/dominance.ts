import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { transport } from '../transport/dominance'
import { globalInputParameters } from './utils'
export const endpoint = new AdapterEndpoint({
  name: 'dominance',
  aliases: ['market_cap_percentage'],
  transport,
  inputParameters: globalInputParameters,
  overrides: overrides.coingecko,
})
