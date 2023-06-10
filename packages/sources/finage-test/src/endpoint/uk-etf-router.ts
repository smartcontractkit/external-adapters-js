import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from './http/uk-etf'
import { wsTransport } from './ws/uk-etf-ws'
import { EquitiesEndpointTypes, equitiesInputParameters } from './types'

export const endpoint = new AdapterEndpoint<EquitiesEndpointTypes>({
  name: 'uk_etf',
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
