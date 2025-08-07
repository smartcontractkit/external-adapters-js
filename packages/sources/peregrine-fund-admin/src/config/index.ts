import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
    default: '',
  },
  API_BASE_URL: {
    description: 'Base URL to Fund Admin Server Endpoint',
    type: 'string',
    default: '',
  },
  API_NAV_ENDPOINT: {
    description:
      'An API endpoint for the latest Net Asset Value (NAV) calculation for a given asset',
    type: 'string',
    default: '',
  },
  API_RESERVE_ENDPOINT: {
    description: 'API Endpoint to get the latest Proof of Reserves for a given asset',
    type: 'string',
    default: '',
  },
})
