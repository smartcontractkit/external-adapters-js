import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  INTEGRATION_API_URL: {
    description:
      'The API URL of the integration where ${INTEGRATION} is the upper-snake-case version of the `integration` input parameter.',
    type: 'string',
    required: true,
    sensitive: false,
    variablePlaceholder: 'INTEGRATION',
  },
  INTEGRATION_API_KEY: {
    description:
      'The API key of the integration where ${INTEGRATION} is the upper-snake-case version of the `integration` input parameter.',
    type: 'string',
    required: true,
    sensitive: true,
    variablePlaceholder: 'INTEGRATION',
  },
})
