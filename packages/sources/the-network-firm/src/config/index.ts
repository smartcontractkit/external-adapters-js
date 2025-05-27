import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API Endpoint to use',
    type: 'string',
    default: 'https://api.oracle-services.ledgerlens.io/v1/chainlink/proof-of-reserves/',
  },
  ALT_API_ENDPOINT: {
    description: 'TNF alt API Endpoint',
    type: 'string',
    default: 'https://api.ledgerlens.io/oc/v1',
  },
  EMGEMX_API_KEY: {
    description: 'API key used for emgemx endpoint',
    type: 'string',
    required: false,
    sensitive: true,
    default: '',
  },
})
