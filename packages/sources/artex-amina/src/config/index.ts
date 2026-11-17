import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description:
        'The AMINA API host, for example https://integration.aminagroup.io or https://integration-test.aminagroup.io',
      type: 'string',
      default: 'https://integration.aminagroup.io',
      sensitive: false,
    },
    AMINA_USER_ID: {
      description: 'The 8-digit AMINA API user ID used for login and request signing',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_PASSWORD: {
      description: 'The password of the AMINA API user',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_HMAC_SECRET: {
      description: 'The HMAC secret that AMINA issued for request signing',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_AGREEMENT_NUMBER: {
      description: 'The AMINA agreement number in scope of the positions request',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_PORTFOLIO: {
      description: 'The AMINA portfolio number that holds the positions',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_ISIN: {
      description: 'The ISIN whose position quantity the adapter publishes',
      type: 'string',
      required: true,
      sensitive: false,
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
      sensitive: false,
    },
  },
  {
    // A framework retry replays the signed request, including the nonce and
    // timestamp, and AMINA rejects a reused nonce. The transport re-signs.
    envDefaultOverrides: {
      RETRY: 0,
    },
  },
)
