import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description:
        'The AMINA API host (the production host by default; the sandbox host is accepted)',
      type: 'string',
      default: 'https://integration.aminagroup.io',
      sensitive: false,
    },
    AMINA_USER_ID: {
      description:
        'The 8-digit AMINA user ID used to log in and to sign requests (the provider calls it non-secret)',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_PASSWORD: {
      description: 'The password of the AMINA user',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_HMAC_SECRET: {
      description: 'The HMAC secret AMINA issued for request signing',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_AGREEMENT_NUMBER: {
      description: 'The AMINA agreement number the requests are made under',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_PORTFOLIO: {
      description: 'The AMINA portfolio number whose positions are read',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_ISIN: {
      description: 'The ISIN of the single position to publish',
      type: 'string',
      required: true,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      // Every signed request carries a single-use nonce, so a replayed request
      // cannot succeed: the next background execution is the retry.
      RETRY: 0,
    },
  },
)
