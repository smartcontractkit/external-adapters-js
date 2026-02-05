import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  AUTH_TOKEN: {
    description: 'JWT token for Canton JSON API authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
  },
  URL: {
    description: 'The Canton JSON API URL',
    type: 'string',
    required: true,
  },
  TEMPLATE_ID: {
    description: 'The template ID to query contracts for (format: packageId:Module:Template)',
    type: 'string',
    required: true,
  },
  CHOICE: {
    description: 'The non-consuming choice to exercise on the contract',
    type: 'string',
    required: true,
  },
  ARGUMENT: {
    description: 'The argument for the choice (JSON string)',
    type: 'string',
    required: false,
  },
  CONTRACT_FILTER: {
    description: 'Filter to query contracts when contractId is not provided (JSON string)',
    type: 'string',
    required: false,
  },
})
