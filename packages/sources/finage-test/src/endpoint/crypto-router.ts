import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/crypto-http'
import { BaseEndpointTypes, priceInputParameters } from './utils'
import { wsTransport } from '../transport/crypto-ws'

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: priceInputParameters,
  overrides: overrides.finage,
})
