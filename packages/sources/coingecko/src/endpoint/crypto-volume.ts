import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { transport } from '../transport/crypto-volume'
import { cryptoInputParams } from './utils'
export const endpoint = new AdapterEndpoint({
  name: 'volume',
  aliases: ['crypto-volume'],
  transport,
  inputParameters: cryptoInputParams,
})
