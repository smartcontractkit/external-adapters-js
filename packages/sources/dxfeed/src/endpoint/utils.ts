import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
      type: 'string',
      description: 'The symbol of the stock to query',
      required: true,
    },
  },
  [
    {
      base: 'TSLA',
    },
  ],
)

/** The WS transport needs settings that are optional for REST, so check them per request */
export const validateWsSettings = (settings: typeof config.settings) => {
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
