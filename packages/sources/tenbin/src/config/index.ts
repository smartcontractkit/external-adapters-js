import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

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
    default: 'https://public-api.tenbin.xyz/v1/verifier/attest',
    sensitive: false,
  },
  BUILD_JSON_ENDPOINT: {
    description: 'URL of the build.json file containing the image digest for verification',
    type: 'string',
    default:
      'https://github.com/tenbinlabs/verification-service-releases/releases/latest/download/build.json',
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
