import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'AMINA API host, for example https://integration-test.aminagroup.io',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_USER_ID: {
      description: 'AMINA user ID',
      type: 'string',
      required: true,
      sensitive: false,
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
      // request, so framework retries are disabled and the positions transport
      // re-signs every attempt.
      RETRY: 0,
    },
  },
)
