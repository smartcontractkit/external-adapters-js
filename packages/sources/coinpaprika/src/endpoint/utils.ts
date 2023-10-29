import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'

import { config } from '../config'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'

export const cryptoInputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin'],
      description: 'The symbol of symbols of the currency to query',
      required: true,
      type: 'string',
    },
    quote: {
      aliases: ['to', 'market'],
      description: 'The symbol of the currency to convert to',
      required: true,
      type: 'string',
    },
    coinid: {
      description: 'The coin ID (optional to use in place of `base`)',
      required: false,
      type: 'string',
    },
    resultPath: {
      description:
        'The path to the result within the asset quote in the provider response (only for REST)',
      required: false,
      type: 'string',
      options: ['price', 'volume_24h', 'market_cap'],
    },
  },
  [
    {
      base: 'AAAA',
      coinid: 'eth-ethereum',
      quote: 'USD',
      resultPath: 'price',
    },
    {
      base: 'ETH',
      quote: 'USD',
      resultPath: 'volume_24h',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof cryptoInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export function customInputValidation(
  req: AdapterRequest<typeof cryptoInputParameters.validated>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (req.requestContext.transportName === 'ws' && !settings.WS_API_ENDPOINT) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_ENDPOINT is required for streaming data',
    })
  }
  return
}
