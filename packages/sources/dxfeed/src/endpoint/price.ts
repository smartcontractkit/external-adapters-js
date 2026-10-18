import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config, wsEnvInputValidationError } from '../config'
import overrides from '../config/overrides.json'
import { buildDxFeedHttpTransport } from '../transport/price-http'
import { transport as wsTransport } from '../transport/price-ws'
import { inputParameters } from './utils'

// Spec price input_parameters: base and quote, plus the optional `transport`
// param ("ws" (dxLink) or "rest"; overnight streams pin "ws"). `transport` is
// also a framework-reserved param name: the router reads the raw request
// data.transport and validates it against the registered transportRoutes
// ("No transport found for key ..." for anything but ws|rest), and the
// declaration type excludes reserved names — so the runtime definition below
// carries the spec param while the exported params type is built from the
// non-reserved subset.
// The provider-specific endpoint wiring below (ws|rest transport routes,
// override layers, WS-path env checks) is preserved adapter code outside
// the template subset, covered by the declared dxlink-control-protocol
// exception set.
// TEMPLATE-EXTENSION: dxlink-control-protocol
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
} as const

const priceRuntimeParamsDefinition = {
  ...priceParamsDefinition,
  transport: {
    description: '"ws" (dxLink) or "rest". Overnight streams pin "ws".',
    required: false,
    type: 'string',
    // Spec price input_parameters ("ws" (dxLink) or "rest") / README options
    // rest,ws: a value outside the list fails input validation with a clean
    // 400 instead of falling through to the router's "No transport found"
    options: ['rest', 'ws'],
  },
} as const

export const priceInputParameters = new InputParameters(
  priceRuntimeParamsDefinition as typeof priceParamsDefinition,
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
// END TEMPLATE-EXTENSION
