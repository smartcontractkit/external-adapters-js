import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'An API endpoint for Data Provider',
      type: 'string',
      default: 'https://api.navfundservices.com',
      sensitive: false,
    },
    API_KEY_FUND_ID: {
      description:
        'The API key for ${FUND_ID} where ${FUND_ID} is the globalFundID input parameter',
      type: 'string',
      required: true,
      sensitive: true,
      variablePlaceholder: 'FUND_ID',
    },
    SECRET_KEY_FUND_ID: {
      description:
        'The secret key for ${FUND_ID} where ${FUND_ID} is the globalFundID input parameter',
      type: 'string',
      required: true,
      sensitive: true,
      variablePlaceholder: 'FUND_ID',
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 5 * 60 * 1000, // one call per five minute
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 30 * 60 * 1000, // 30 minute cache
      BACKGROUND_EXECUTE_TIMEOUT: (5 + 1) * 60 * 1000, // 5 minutes wait + 1 minute for execution
      RETRY: 0, // Disables retry on Framework
    },
  },
)
