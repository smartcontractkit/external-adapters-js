import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { CryptoEndpointTypes, inputParameters } from '../../crypto-utils'
import { httpTransport } from '../http/crypto'
import { wsTransport } from '../ws/crypto'
import overrides from '../../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: ['price', 'prices', 'crypto-synth'],
  transportRoutes: new TransportRoutes<CryptoEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'ws',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
