import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description:
        'The AMINA API origin, without a path. The production and the sandbox environment have separate hosts and credentials',
      type: 'string',
      required: true,
      sensitive: false,
    },
    AMINA_USER_ID: {
      description: 'The AMINA user ID of the account that reads the portfolios',
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
      description: 'The HMAC secret that signs each positions request',
      type: 'string',
      required: true,
      sensitive: true,
    },
    AMINA_AGREEMENT_NUMBER: {
      description: 'The AMINA context agreement number that the positions request signs',
      type: 'string',
      required: true,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      // Every positions request is signed over a nonce and a timestamp, and the
      // provider rejects a nonce or a timestamp that it has already seen, so a
      // repeated request can only fail. The next background execution is the retry.
      RETRY: 0,
    },
  },
)
