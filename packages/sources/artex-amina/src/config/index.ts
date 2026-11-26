import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'AMINA host or OpenAPI server URL; a trailing /api/b2c/v1 is stripped',
      type: 'string',
      default: 'https://integration.aminagroup.io',
      sensitive: false,
    },
    AMINA_USER_ID: {
      description: '8-digit AMINA user ID',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_PASSWORD: {
      description: 'password',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_HMAC_SECRET: {
      description: 'HMAC secret',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_AGREEMENT_NUMBER: {
      description: 'agreement number',
      type: 'string',
      required: true,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      // Framework retries replay the signed nonce (Manual p.6).
      RETRY: 0,
      // Cold start is auth (186s) + page 0 (186s); keep headroom within the
      // framework maximum. The transport also single-flights a cache key.
      BACKGROUND_EXECUTE_TIMEOUT: 600_000,
    },
  },
)
