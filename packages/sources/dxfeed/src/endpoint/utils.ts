import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import type { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import type { config } from '../config'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
      type: 'string',
      description: 'The symbol of the stock to query; passed to the provider exactly as given',
      required: true,
    },
  },
  [
    {
      base: 'TSLA',
    },
  ],
)

export const validateWsEnvVars = (
  settings: Pick<typeof config.settings, 'WS_API_ENDPOINT' | 'API_USERNAME' | 'API_PASSWORD'>,
): AdapterError | undefined => {
  if (!settings.WS_API_ENDPOINT) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_ENDPOINT is not set',
    })
  }
  if (!settings.API_USERNAME || !settings.API_PASSWORD) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'API_USERNAME and API_PASSWORD are required for the ws transport',
    })
  }
  return
}
