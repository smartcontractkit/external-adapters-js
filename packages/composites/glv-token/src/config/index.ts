import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    ARBITRUM_RPC_URL: {
      description: 'RPC url of Arbitrum node',
      type: 'string',
      required: true,
      sensitive: false,
    },
    ARBITRUM_CHAIN_ID: {
      description: 'The chain id to connect to',
      type: 'number',
      required: true,
      default: 42161,
      sensitive: false,
    },
    DATASTORE_CONTRACT_ADDRESS: {
      description: 'Address of Data Store contract',
      type: 'string',
      required: true,
      default: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
      sensitive: false,
    },
    GLV_READER_CONTRACT_ADDRESS: {
      description: 'Address of Glv Reader Contract',
      type: 'string',
      required: true,
      default: '0x2C670A23f1E798184647288072e84054938B5497',
      sensitive: false,
    },
    DATA_ENGINE_ADAPTER_URL: {
      description: 'URL of Data Engine EA',
      type: 'string',
      required: true,
      sensitive: false,
    },
    MARKET_INFO_API: {
      description: 'URL market meta data supported by Glv',
      type: 'string',
      required: true,
      default: 'https://arbitrum-api.gmxinfra.io/markets',
      sensitive: false,
    },
    TOKEN_INFO_API: {
      description: 'URL to token meta data supported by Glv ',
      type: 'string',
      required: true,
      default: 'https://arbitrum-api.gmxinfra.io/tokens',
      sensitive: false,
    },
    GLV_INFO_API_TIMEOUT_MS: {
      description:
        'The amount of time the request to the GLV info APIs should wait before timing out. ' +
        'Distinct from timeout used to make requests to the EAs which can be set with API_TIMEOUT',
      type: 'number',
      default: 10_000,
      sensitive: false,
    },
    METADATA_REFRESH_INTERVAL_MS: {
      description: 'The amount of time the metadata should be refreshed',
      type: 'number',
      default: 60 * 60 * 3 * 1000, // 3 hours
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
      RETRY: 3,
    },
  },
)
