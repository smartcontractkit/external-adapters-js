import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/forex-http'
import { BaseEndpointTypes, priceInputParameters } from './utils'
import { wsTransport } from '../transport/forex-ws'

export const endpoint = new PriceEndpoint({
  name: 'forex',
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
