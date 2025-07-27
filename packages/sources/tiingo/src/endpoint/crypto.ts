import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/crypto-http'
import { wsTransport } from '../transport/crypto-ws'
import {
  BaseCryptoEndpointTypes,
  inputParameters,
  tiingoCommonSubscriptionRequestTransform,
} from './utils'

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: ['price', 'prices', 'crypto-synth'],
  transportRoutes: new TransportRoutes<BaseCryptoEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'ws',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
  requestTransforms: [tiingoCommonSubscriptionRequestTransform],
})
