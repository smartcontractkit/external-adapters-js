import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { InputParameter } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { buildDxFeedHttpTransport } from '../transport/price-http'
import { transport as wsTransport } from '../transport/price-ws'
import { inputParameters } from './utils'

// Spec price input_parameters: `transport` ("ws" (dxLink) or "rest", optional;
// overnight streams pin "ws"). The framework reserves `transport` as a routing
// param name at the type level (its definition guard excludes it), so the
// declaration below is cast past that guard — the runtime validator enforces
// the ws|rest options alongside the transportRoutes check in the default router.
const transportParam: InputParameter = {
  description: '"ws" (dxLink stream) or "rest" (HTTP API); overnight streams pin "ws"',
  options: ['ws', 'rest'],
  required: false,
  type: 'string',
}

const priceParamsDefinition = {
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
  transport: transportParam,
} as const

export const priceInputParameters = new InputParameters(
  priceParamsDefinition as unknown as Omit<typeof priceParamsDefinition, 'transport'>,
)

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
