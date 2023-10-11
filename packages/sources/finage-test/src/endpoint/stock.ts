import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { StockEndpoint } from '@chainlink/external-adapter-framework/adapter/stock'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/stock-http'
import { wsTransport } from '../transport/stock-ws'
import { StockEndpointTypes, stockInputParameters } from './utils'

export const endpoint = new StockEndpoint({
  name: 'stock',
  transportRoutes: new TransportRoutes<StockEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: stockInputParameters,
  overrides: overrides.finage,
})
