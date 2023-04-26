import { config } from '../config'
import { httpTransport } from './http/stock'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from './ws/stock-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import overrides from '../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const inputParameters = {
  base: {
    aliases: ['from', 'symbol'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to query',
  },
} satisfies InputParameters

export interface StockEndpointParams {
  base: string
}

export type EndpointTypes = {
  Request: {
    Params: StockEndpointParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'stock',
  transportRoutes: new TransportRoutes<EndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: inputParameters,
  overrides: overrides.finage,
})
