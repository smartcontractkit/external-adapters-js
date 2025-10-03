import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config: AdapterConfig = new AdapterConfig({
  API_BASE_URL: {
    description: 'The API URL for the LiveArt data provider',
    type: 'string',
    required: true,
    default: 'https://artwork-price-oracle-api-dev-ms.liveart.ai',
  },
  BEARER_TOKEN: {
    description: 'The Bearer token for authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
