export const customSettings = {
  API_ENDPOINT: {
    type: 'string',
    description: 'The user ID used to authenticate',
    default: 'https://oracle.prod.gsr.io/v1',
  },
  WS_API_ENDPOINT: {
    type: 'string',
    description: 'The user ID used to authenticate',
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
} as const
