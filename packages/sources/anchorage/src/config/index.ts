import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Anchorage',
    type: 'string',
    required: true,
  },
  API_LIMIT: {
    description: 'The maximum number of results to request from the API',
    type: 'number',
    default: 50,
    validate: validator.integer({ min: 1, max: 500 }),
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
