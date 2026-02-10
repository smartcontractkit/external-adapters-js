import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const defaultEndpoint = 'trust'

export const config = new AdapterConfig({
  TURSO_DATABASE_URL: {
    description: 'The Turso database URL (libsql://...)',
    type: 'string',
    required: true,
    sensitive: true,
  },
  TURSO_AUTH_TOKEN: {
    description: 'The Turso database auth token',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
