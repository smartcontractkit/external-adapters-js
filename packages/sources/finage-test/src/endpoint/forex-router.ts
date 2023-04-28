import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from './http/forex'
import { PriceEndpointTypes, priceInputParameters } from './types'
import { wsTransport } from './ws/forex-ws'

export const endpoint = new PriceEndpoint<PriceEndpointTypes>({
  name: 'forex',
  transportRoutes: new TransportRoutes<PriceEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: priceInputParameters,
  overrides: overrides.finage,
})
