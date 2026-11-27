import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'The AMINA API host, without a path',
      type: 'string',
      default: 'https://integration.aminagroup.io',
      sensitive: false,
    },
    AMINA_USER_ID: {
      description: 'The AMINA user id that the adapter signs its requests as',
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
      description: 'The secret that signs each AMINA positions request',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_AGREEMENT_NUMBER: {
      description: 'The AMINA agreement that the positions are read under',
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
    envDefaultOverrides: {
      // Every positions request carries a fresh nonce and timestamp in its
      // signature, and AMINA rejects a nonce that it has already seen, so a
      // repeated signed request cannot succeed.
      RETRY: 0,
    },
  },
)
