import { config } from '../config'
import { httpTransport } from './http/forex'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { wsTransport } from './ws/forex-ws'
import overrides from '../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'symbol'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
} as const

export type ForexEndpointParams = PriceEndpointParams

export type EndpointTypes = {
  Request: {
    Params: ForexEndpointParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'forex',
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
