import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

const EIGHT_DIGITS = /^\d{8}$/

function validateApiEndpoint(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return 'Value must be an HTTPS origin'
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return 'Value must be an HTTPS origin'
  }
  if (url.protocol !== 'https:') {
    return 'Value must use HTTPS'
  }
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    return 'Value must be an origin without a path, query, fragment, or credentials'
  }
  return undefined
}

function validateUserId(value: unknown): string | undefined {
  return typeof value === 'string' && EIGHT_DIGITS.test(value)
    ? undefined
    : 'Value must be an 8-digit AMINA user ID'
}

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'api endpoint',
      type: 'string',
      required: true,
      sensitive: false,
      validate: {
        meta: { details: 'Value must be an HTTPS origin' },
        fn: validateApiEndpoint,
      },
    },
    AMINA_USER_ID: {
      description: 'user ID',
      type: 'string',
      required: true,
      sensitive: false,
      validate: {
        meta: {
          details: 'Value must be an 8-digit AMINA user ID',
        },
        fn: validateUserId,
      },
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
      // 5 min covers the auth + page retry budget.
      BACKGROUND_EXECUTE_TIMEOUT: 300_000,
      CACHE_MAX_AGE: 60 * 60 * 1000,
      WARMUP_SUBSCRIPTION_TTL: 60 * 60 * 1000,
    },
  },
)
