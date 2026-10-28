import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import type { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import type { config } from '../config'
import overrides from '../config/overrides.json'
import { buildDxFeedHttpTransport } from '../transport/price-http'
import { transport as wsTransport } from '../transport/price-ws'
import { wsEnvPresenceError } from './utils'

const priceParamsDefinition = {
  base: {
    aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
    type: 'string',
    description: 'The symbol of the stock to query; passed to the provider exactly as given',
    required: true,
  },
} as const

export const inputParameters = new InputParameters(priceParamsDefinition, [
  {
    base: 'TSLA',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint<BaseEndpointTypes>({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', buildDxFeedHttpTransport()),
  defaultTransport: 'rest',
  inputParameters,
  overrides: overrides.dxfeed,
  customInputValidation: (req, settings): AdapterError | undefined => {
    if (req.requestContext.transportName !== 'ws') {
      return
    }
    return wsEnvPresenceError(settings)
  },

  // AdapterEndpoint (unlike the framework's PriceEndpoint) has no built-in
  // check that `result` is actually a number -- replicate the numeric-result
  // validation dxfeed relied on upstream.
  customOutputValidation: (output): AdapterError | undefined => {
    if ('errorMessage' in output) {
      return undefined
    }
    if (typeof output.result !== 'number' || Number.isNaN(output.result)) {
      return new AdapterError({
        statusCode: 502,
        message: `Invalid numeric result: ${output.result}`,
      })
    }
    return undefined
  },
})
