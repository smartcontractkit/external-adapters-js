import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'The API token to access the Turso DB API',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'The URL of the Turso DB API endpoint',
    type: 'string',
    default: 'https://ion-digital-prod-austpryb.aws-us-east-1.turso.io/v2/pipeline',
    sensitive: false,
  },
})
