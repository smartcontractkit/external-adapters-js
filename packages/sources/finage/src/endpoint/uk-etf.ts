import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/uk-etf-http'
import { wsTransport } from '../transport/uk-etf-ws'
import { UkEtfEndpointTypes, ukEtfInputParameters } from './utils'

export const endpoint = new AdapterEndpoint({
  name: 'uk_etf',
  transportRoutes: new TransportRoutes<UkEtfEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: ukEtfInputParameters,
  overrides: overrides.finage,
})
