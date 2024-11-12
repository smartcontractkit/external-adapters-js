import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/etf-http'
import { wsTransport } from '../transport/etf-ws'
import { EtfEndpointTypes, etfInputParameters } from './utils'

export const endpoint = new AdapterEndpoint({
  name: 'etf',
  transportRoutes: new TransportRoutes<EtfEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: etfInputParameters,
  overrides: overrides.finage,
})
