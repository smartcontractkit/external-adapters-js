import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  MAX_RESPONSE_TEXT_IN_ERROR_MESSAGE: {
    description: 'How much of a response may be included in an error message before trunctating it',
    type: 'number',
    default: 200,
    sensitive: false,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
    sensitive: false,
  },
})
