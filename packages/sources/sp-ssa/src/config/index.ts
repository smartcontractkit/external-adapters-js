import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description:
        'The S&P SSA API base URL. The adapter appends the path of the scores resource to it.',
      type: 'string',
      default: 'https://api.use1.uat.ratings.spglobal.com/ssa-defiscoreapi/extoauthv2',
      sensitive: false,
    },
    AUTH_API_ENDPOINT: {
      description: 'The S&P token endpoint that issues the JWT the scores request carries',
      type: 'string',
      default: 'https://secureapi.signinpreview.spglobal.com/gettoken/token',
      sensitive: false,
    },
    SPGI_CLIENT_ID: {
      description: 'The S&P client id that the token request authenticates with',
      type: 'string',
      required: true,
      sensitive: true,
    },
    SPGI_APIKEY: {
      description: 'The S&P apikey that the scores request carries',
      type: 'string',
      required: true,
      sensitive: true,
    },
  },
  {
    // The S&P API accepts 300 requests each minute for one apikey.
    // A provider failure must reach the caller as a 502, not as the framework's
    // 504: the framework retry holds the failure one to two seconds before it
    // gives up, longer than the adapter polls its cache. The next background
    // execution is the retry.
    envDefaultOverrides: {
      RATE_LIMIT_CAPACITY_MINUTE: 300,
      RETRY: 0,
    },
  },
)
