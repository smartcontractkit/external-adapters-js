export const DEFAULT_API_ENDPOINT = 'https://oracle.prod.gsr.io/v1'
export const DEFAULT_WS_API_ENDPOINT = 'wss://oracle.prod.gsr.io/oracle'

export const customSettings = {
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
