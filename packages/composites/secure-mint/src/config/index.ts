import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    SECURE_MINT_INDEXER_URL: {
      description: 'Url to secure-mint-indexer',
      type: 'string',
      required: true,
    },
    BITGO_RESERVES_EA_URL: {
      description: 'Url to Bitgo Reserves EA',
      type: 'string',
      default: '',
    },

    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 1_000,
    },
  },
  {
    // Unlike regular EA where input is fixed for a specifc feed, this EA,
    // input is dynamic for a feed. Hence we would want to have
    // - a small subscription set (as old request will not be used once we've moved on)
    // - a small TTL on subscriptions
    // - a small cache on result
    envDefaultOverrides: {
      SUBSCRIPTION_SET_MAX_ITEMS: 1000,
      WARMUP_SUBSCRIPTION_TTL: 60_000,
      CACHE_MAX_AGE: 60_000,
    },
  },
)
