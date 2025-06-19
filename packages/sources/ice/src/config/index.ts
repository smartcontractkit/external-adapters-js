import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  USER_GROUP: {
    description: 'User group for ICE',
    type: 'string',
    default: 'chain.link',
  },
  NETDANIA_PASSWORD: {
    description: 'Password for ICE',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'streaming server endpoint for ICE',
    type: 'string',
    required: true,
  },
  API_ENDPOINT_FAILOVER_1: {
    description: 'failover endpoint for ICE',
    type: 'string',
    default: '',
    required: false,
  },
  API_ENDPOINT_FAILOVER_2: {
    description: 'failover endpoint for ICE',
    type: 'string',
    default: '',
    required: false,
  },
  API_ENDPOINT_FAILOVER_3: {
    description: 'failover endpoint for ICE',
    type: 'string',
    default: '',
    required: false,
  },
  POLLING_INTERVAL: {
    description: 'Polling interval for ICE',
    type: 'number',
    default: 2000,
  },
  CONNECTING_TIMEOUT_MS: {
    description: 'Connecting timeout in milliseconds for ICE',
    type: 'number',
    default: 2000,
  },
})
