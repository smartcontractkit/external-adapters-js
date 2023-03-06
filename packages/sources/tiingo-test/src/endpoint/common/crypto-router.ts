import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { CryptoEndpointTypes, inputParameters } from '../../crypto-utils'
import { httpTransport } from '../http/crypto'
import { wsTransport } from '../ws/crypto'
import overrides from '../../config/overrides.json'

export const endpoint = new CryptoPriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['price', 'prices', 'crypto-synth'],
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
