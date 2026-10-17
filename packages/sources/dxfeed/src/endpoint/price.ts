import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, wsEnvInputValidationError } from '../config'
import overrides from '../config/overrides.json'
import { buildDxFeedHttpTransport } from '../transport/price-http'
import { transport as wsTransport } from '../transport/price-ws'
import { inputParameters } from './utils'

// Spec price input_parameters: base, quote and the optional `transport` param
// ("ws" (dxLink stream) or "rest"; overnight streams pin "ws"). Routing itself
// reads the raw request data.transport against transportRoutes; the declaration
// adds transport to the validated param set and constrains its values to the
// registered ws|rest routes.
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
  transport: {
    description:
      'Transport to use for the request: "ws" (dxLink stream) or "rest". Overnight streams pin "ws".',
    options: ['ws', 'rest'],
    required: false,
    type: 'string',
  },
} as const

// `transport` sits in the framework's type-level reserved param names (the
// defaultRouter reads the raw request data.transport for routing), so the
// constructor's type argument omits the key while the runtime definition keeps
// it — the runtime validator enforces the ws|rest options like any other param
export const priceInputParameters = new InputParameters(
  priceParamsDefinition as Omit<typeof priceParamsDefinition, 'transport'>,
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
  // The spec breaking_change_env_checks only apply to WS-path requests: the
  // framework resolves requestContext.transportName (ws|rest) before calling
  // this validator, and the REST path is untouched (owner decision
  // rest_transport_scope=keep_untouched)
  customInputValidation: (request, settings) =>
    request.requestContext?.transportName === 'ws'
      ? wsEnvInputValidationError(settings)
      : undefined,
})
