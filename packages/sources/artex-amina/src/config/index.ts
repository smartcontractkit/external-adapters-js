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
  },
  {
    envDefaultOverrides: {
      // The framework retry loop re-sends the same Axios config, including the
      // AMINA nonce/timestamp/signature. Manual p.6 requires a unique nonce per
      // request, so framework retries are disabled. The adapter bootstrap
      // rejects any RETRY override so this cannot be re-enabled by env.
      RETRY: 0,
      // 3 attempts x 30 s API timeout + 2 s + 4 s backoff = 96 s, so the
      // framework default 90 s background timeout is too short.
      BACKGROUND_EXECUTE_TIMEOUT: 180_000,
    },
  },
)
