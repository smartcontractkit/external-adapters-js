import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { httpTransport } from './stock'
import { wsTransport } from './stock-ws'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'

const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin', 'asset'],
    required: true,
    description: 'The symbol of the asset to query',
    type: 'string',
  },
})

// Common endpoint type shared by the REST and WS transports
export type StockEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const transportRoutes = new TransportRoutes<StockEndpointTypes>()
  .register('ws', wsTransport)
  .register('rest', httpTransport)

export const endpoint = new AdapterEndpoint<StockEndpointTypes>({
  name: 'stock',
  transportRoutes,
  inputParameters,
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  overrides: overrides.tradingeconomics,
})
