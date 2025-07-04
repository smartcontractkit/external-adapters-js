import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

// TODO validation rules to ensure base and quote are only 3 characters long and not the same?

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
    required: false,
    default: 'https://balancer.netdania.com/StreamingServer/StreamingServer',
  },
  FAILOVER_API_ENDPOINT: {
    description: 'failover endpoints for ICE',
    type: 'string',
    default: 'https://balancer.datafeeds.io/StreamingServer/StreamingServer',
  }, // TODO how to have multiple failover endpoints?
  POLLING_INTERVAL: {
    description: 'Polling interval for ICE',
    type: 'number',
    default: 2000,
  },
  CONNECTING_TIMEOUT_MS: {
    description: 'Connecting timeout in milliseconds for ICE',
    type: 'number',
    default: 4000,
  },
})
