import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_USERNAME: {
    description: 'API username for WS endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_PASSWORD: {
    description: 'API password for WS endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Data Provider',
    type: 'string',
    required: true,
  },
})
