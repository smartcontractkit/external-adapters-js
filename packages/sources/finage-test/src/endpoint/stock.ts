import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/stock-http'
import { wsTransport } from '../transport/stock-ws'
import { EquitiesEndpointTypes, equitiesInputParameters } from './utils'

export const endpoint = new AdapterEndpoint({
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
