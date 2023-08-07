import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    type: 'string',
    description: 'The HTTP API endpoint to use',
    default: 'https://oracle.prod.gsr.io/v1',
  },
  WS_API_ENDPOINT: {
    type: 'string',
    description: 'The WS API endpoint to use',
    default: 'wss://oracle.prod.gsr.io/oracle',
  },
  WS_USER_ID: {
    type: 'string',
    description: 'The user ID used to authenticate',
    required: true,
  },
  WS_PUBLIC_KEY: {
    type: 'string',
    description: 'The public key used to authenticate',
    required: true,
  },
  WS_PRIVATE_KEY: {
    type: 'string',
    description: 'The private key used to authenticate',
    required: true,
    sensitive: true,
  },
})
