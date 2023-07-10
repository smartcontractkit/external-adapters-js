import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { transport } from '../transport/crypto'
import { cryptoInputParams } from './utils'
export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: ['crypto-batched', 'batched', 'batch', 'price'],
  transport,
  inputParameters: cryptoInputParams,
  overrides: overrides.coingecko,
})
