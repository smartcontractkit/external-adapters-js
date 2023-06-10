import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from './http/stock'
import { wsTransport } from './ws/stock-ws'
import { EquitiesEndpointTypes, equitiesInputParameters } from './types'

export const endpoint = new AdapterEndpoint<EquitiesEndpointTypes>({
  name: 'stock',
  transportRoutes: new TransportRoutes<EquitiesEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: equitiesInputParameters,
  overrides: overrides.finage,
})
