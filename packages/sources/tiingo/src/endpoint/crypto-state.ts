import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { wsTransport } from '../transport/crypto-state'
import overrides from '../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { BaseCryptoEndpointTypes, inputParameters } from './utils'

export const endpoint = new PriceEndpoint({
  name: 'cryptostate',
  aliases: ['state'],
  transportRoutes: new TransportRoutes<BaseCryptoEndpointTypes>().register('ws', wsTransport),
  defaultTransport: 'ws',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
