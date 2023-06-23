import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { httpTransport } from '../transport/stock-http'
import { wsTransport } from '../transport/stock-ws'
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
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const transportRoutes = new TransportRoutes<BaseEndpointTypes>()
  .register('ws', wsTransport)
  .register('rest', httpTransport)

export const endpoint = new AdapterEndpoint({
  name: 'stock',
  aliases: ['commodities'],
  transportRoutes,
  inputParameters,
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  overrides: overrides.tradingeconomics,
})
