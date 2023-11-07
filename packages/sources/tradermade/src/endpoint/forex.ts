import { ForexPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterRequestData,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/forex-http'
import { wsTransport } from '../transport/forex-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import wsPairs from '../config/wsPairs.json'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol'],
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
    },
    quote: {
      aliases: ['to', 'market', 'convert'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
  },
  [
    {
      base: 'ETH',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}
function customInputValidation(
  req: AdapterRequest<typeof inputParameters.validated>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (req.requestContext.transportName === 'ws' && !settings.WS_API_KEY) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_KEY is not set',
    })
  }
  return
}

export const endpoint = new ForexPriceEndpoint({
  name: 'forex',
  aliases: ['batch'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  customRouter: (req, adapterConfig) => {
    const { base, quote } = req.requestContext.data as typeof inputParameters.validated

    const rawRequestBody = req.body as unknown as { data: AdapterRequestData }
    if (rawRequestBody.data?.transport) {
      return rawRequestBody.data?.transport
    }

    if (
      adapterConfig.WS_ENABLED &&
      (wsPairs as Record<string, boolean>)[`${base}${quote}`.toUpperCase()]
    ) {
      return 'ws'
    }
    return 'rest'
  },
  inputParameters,
  customInputValidation,
  overrides: overrides.tradermade,
})
