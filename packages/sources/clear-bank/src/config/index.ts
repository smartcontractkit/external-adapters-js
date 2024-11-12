import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://institution-api.clearbank.co.uk/',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
  PAGE_SIZE: {
    description: 'The number of accounts to fetch per call to /accounts. Must be >= 1 and <= 50.',
    type: 'number',
    required: false,
    default: 50,
    validate: validator.integer({ min: 1, max: 50 }),
  },
})
