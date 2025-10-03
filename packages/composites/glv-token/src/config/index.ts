import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

export const config = new AdapterConfig(
  {
    ARBITRUM_RPC_URL: {
      description: 'RPC url of Arbitrum node',
      type: 'string',
      required: true,
    },
    ARBITRUM_CHAIN_ID: {
      description: 'The chain id to connect to',
      type: 'number',
      required: true,
      default: 42161,
    },
    DATASTORE_CONTRACT_ADDRESS: {
      description: 'Address of Data Store contract',
      type: 'string',
      required: true,
      default: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
    },
    GLV_READER_CONTRACT_ADDRESS: {
      description: 'Address of Glv Reader Contract',
      type: 'string',
      required: true,
      default: '0x6a9505D0B44cFA863d9281EA5B0b34cB36243b45',
    },
    TIINGO_ADAPTER_URL: {
      description: 'URL of Tiingo EA',
      type: 'string',
      required: true,
    },
    NCFX_ADAPTER_URL: {
      description: 'URL of NCFX EA',
      type: 'string',
      required: true,
    },
    COINMETRICS_ADAPTER_URL: {
      description: 'URL of Coinmetrics EA',
      type: 'string',
      required: true,
    },
    MIN_REQUIRED_SOURCE_SUCCESS: {
      description: 'Minimum number of source EAs that need to successfully return a value.',
      type: 'number',
      required: true,
      default: 1,
      validate: validator.integer({ min: 1, max: 3 }),
    },
    MARKET_INFO_API: {
      description: 'URL market meta data supported by Glv',
      type: 'string',
      required: true,
      default: 'https://arbitrum-api.gmxinfra.io/markets',
    },
    TOKEN_INFO_API: {
      description: 'URL to token meta data supported by Glv ',
      type: 'string',
      required: true,
      default: 'https://arbitrum-api.gmxinfra.io/tokens',
    },
    GLV_INFO_API_TIMEOUT_MS: {
      description:
        'The amount of time the request to the GLV info APIs should wait before timing out. ' +
        'Distinct from timeout used to make requests to the EAs which can be set with API_TIMEOUT',
      type: 'number',
      default: 10_000,
    },
    METADATA_REFRESH_INTERVAL_MS: {
      description: 'The amount of time the metadata should be refreshed',
      type: 'number',
      default: 60 * 60 * 3 * 1000, // 3 hours
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
    },
  },
  {
    envDefaultOverrides: {
      RETRY: 3,
    },
  },
)
