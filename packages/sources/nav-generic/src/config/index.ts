import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  DEFAULT_API_ENDPOINT: {
    description: 'API endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
