import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

const EIGHT_DIGITS = /^\d{8}$/

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description:
        'AMINA API host, for example https://integration-test.aminagroup.io. Must use HTTPS.',
      type: 'string',
      required: true,
      sensitive: false,
      validate: {
        meta: { details: 'Value must be an HTTPS origin' },
        fn: (value) => {
          if (typeof value !== 'string') {
            return 'Value must be an HTTPS origin'
          }
          try {
            const url = new URL(value)
            if (url.protocol !== 'https:') {
              return 'Value must use HTTPS'
            }
            if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
              return 'Value must be an origin without a path, query, fragment, or credentials'
            }
            return undefined
          } catch {
            return 'Value must be an HTTPS origin'
          }
        },
      },
    },
    AMINA_USER_ID: {
      description: 'AMINA 8-digit user ID',
      type: 'string',
      required: true,
      sensitive: false,
      validate: {
        meta: {
          details: 'Value must be an 8-digit AMINA user ID',
        },
        fn: (value) =>
          typeof value === 'string' && EIGHT_DIGITS.test(value)
            ? undefined
            : 'Value must be an 8-digit AMINA user ID',
      },
    },
    AMINA_PASSWORD: {
      description: 'AMINA password',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_HMAC_SECRET: {
      description: 'AMINA HMAC secret',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_AGREEMENT_NUMBER: {
      description: 'AMINA agreement number used in the HMAC and request header',
      type: 'string',
      required: true,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      // The framework retry loop re-sends the same Axios config, including the
      // AMINA nonce/timestamp/signature. Manual p.6 requires a unique nonce per
      // request, so framework retries are disabled. The adapter bootstrap
      // rejects any RETRY override so this cannot be re-enabled by env.
      RETRY: 0,
      // 5 min covers the auth + page retry budget; 1 h is the framework max
      // for a monthly source.
      BACKGROUND_EXECUTE_TIMEOUT: 300_000,
      CACHE_MAX_AGE: 60 * 60 * 1000,
      WARMUP_SUBSCRIPTION_TTL: 60 * 60 * 1000,
    },
  },
)
