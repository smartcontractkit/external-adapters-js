import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

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
        meta: { details: 'Value must be an HTTPS URL' },
        fn: (value) => {
          if (typeof value !== 'string') {
            return 'Value must be an HTTPS URL'
          }
          try {
            return new URL(value).protocol === 'https:' ? undefined : 'Value must use HTTPS'
          } catch {
            return 'Value must be an HTTPS URL'
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
    AMINA_USER_AGENT: {
      description: 'User-Agent header sent on the positions GET',
      type: 'string',
      default: 'chainlink-artex-amina-adapter/1.0.0',
      sensitive: false,
    },
    BACKGROUND_EXECUTE_MS: {
      description: 'Idle background sleep. Active cache entries are re-checked every 100 ms.',
      type: 'number',
      default: 1_000,
      sensitive: false,
      validate: validator.integer({ min: 0, max: 1_000 }),
    },
    ERROR_CACHE_TTL_MS: {
      description: 'How long a failed provider response stays in the response cache before a retry',
      type: 'number',
      default: 60_000,
      sensitive: false,
      validate: validator.integer({ min: 0, max: 60 * 60 * 1000 }),
    },
    MAX_ATTEMPTS: {
      description: 'Maximum attempts for a retryable AMINA request',
      type: 'number',
      default: 3,
      sensitive: false,
      validate: validator.integer({ min: 1, max: 10 }),
    },
    RETRY_BASE_DELAY_MS: {
      description: 'Base delay for exponential retry',
      type: 'number',
      default: 2_000,
      sensitive: false,
      validate: validator.integer({ min: 0, max: 40_000 }),
    },
    RETRY_MAX_DELAY_MS: {
      description: 'Maximum delay between retry attempts',
      type: 'number',
      default: 40_000,
      sensitive: false,
      validate: validator.integer({ min: 0, max: 40_000 }),
    },
  },
  {
    envDefaultOverrides: {
      API_TIMEOUT: 30_000,
      CACHE_MAX_AGE: 60 * 60 * 1000,
      WARMUP_SUBSCRIPTION_TTL: 60 * 60 * 1000,
      BACKGROUND_EXECUTE_TIMEOUT: 9 * 60 * 1000,
      RETRY: 0,
    },
  },
)
