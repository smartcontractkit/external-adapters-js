import overrides from '../config/overrides.json'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { transport } from '../transport/crypto-marketcap'
import { cryptoInputParams } from './utils'
export const endpoint = new AdapterEndpoint({
  name: 'marketcap',
  aliases: ['crypto-marketcap'],
  transport,
  inputParameters: cryptoInputParams,
  overrides: overrides.coingecko,
})
