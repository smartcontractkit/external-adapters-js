import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
      type: 'string',
      description:
        'The symbol of the stock to query; suffixes such as :USLF24 are passed through as given.',
      required: true,
    },
  },
  [
    {
      base: 'TSLA',
    },
  ],
)

/** WS-only env checks; REST can run without them. */
export const validateWsEnvVars = (settings: typeof config.settings) => {
  if (!settings.WS_API_ENDPOINT) {
    return new AdapterInputError({ statusCode: 400, message: 'WS_API_ENDPOINT is not set' })
  }
  if (!settings.API_USERNAME || !settings.API_PASSWORD) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'API_USERNAME and API_PASSWORD are required for the ws transport',
    })
  }
  return undefined
}
