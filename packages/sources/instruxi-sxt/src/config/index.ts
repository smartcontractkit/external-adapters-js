import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider (SxT',
    type: 'string',
    required: true,
    default: 'https://proxy.api.spaceandtime.app',
  },
  API_KEY: {
    description: 'An API key for Data Provider (SxT)',
    type: 'string',
    sensitive: true,
    required: true,
  },
  SXT_TABLE_NAME: {
    description: 'Space and Time Attestations table name',
    type: 'string',
    sensitive: true,
    required: true,
  },
})
