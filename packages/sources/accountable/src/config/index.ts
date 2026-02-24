import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ACCOUNTABLE_BEARER_TOKEN: {
    description: 'Bearer token for Accountable API authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'API endpoint for Accountable',
    type: 'string',
    default: 'https://dvn.accountable.capital/v1',
  },
})
