import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The API endpoint of Hastra',
    type: 'string',
    required: true,
  },
})
