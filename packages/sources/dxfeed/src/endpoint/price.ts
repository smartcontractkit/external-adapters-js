import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { buildDxFeedHttpTransport } from '../transport/price-http'
import { transport as wsTransport } from '../transport/price-ws'
import { inputParameters } from './utils'

export const priceInputParameters = new InputParameters({
  ...inputParameters.definition,
  base: {
    aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
    description:
      'The symbol of the stock to query, append `:USLF24` to the end for after hours on ws endpoints',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to'],
    description: 'The quote currency to convert the base price to',
    required: true,
    type: 'string',
  },
  // Spec price input_parameters: `transport` ("ws" (dxLink) or "rest",
  // optional; overnight streams pin "ws"). `transport` is a framework-reserved
  // request param in 2.20.0 and cannot be re-declared here: the default router
  // reads `data.transport` and validates it against the registered
  // transportRoutes below ('ws' | 'rest'), rejecting anything else with a 400.
})

export type BaseEndpointTypes = {
  Parameters: typeof priceInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', buildDxFeedHttpTransport()),
  defaultTransport: 'rest',
  inputParameters: priceInputParameters,
  overrides: overrides.dxfeed,
})
