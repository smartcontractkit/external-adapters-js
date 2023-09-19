import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_KEY: {
      description: 'API KEY for KAIKO',
      type: 'string',
      required: true,
      sensitive: true,
    },
    API_ENDPOINT: {
      description: 'API endpoint for KAIKO',
      type: 'string',
      default: 'https://us.market-api.kaiko.io/v2/data',
    },
  },
  {
    envDefaultOverrides: {
      API_TIMEOUT: 60_000,
      MAX_HTTP_REQUEST_QUEUE_LENGTH: 300,
    },
  },
)
