import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    DATA_ENGINE_ADAPTER_URL: {
      description: 'URL of Data Engine EA',
      type: 'string',
      required: true,
      sensitive: false,
    },
    ARBITRUM_RPC_URL: {
      description: 'RPC url of Arbitrum node',
      type: 'string',
      sensitive: false,
    },
    ARBITRUM_CHAIN_ID: {
      description: 'The chain id to connect to for Arbitrum',
      type: 'number',
      default: 42161,
      sensitive: false,
    },
    BOTANIX_RPC_URL: {
      description: 'RPC url of Botanix node',
      type: 'string',
      sensitive: false,
    },
    BOTANIX_CHAIN_ID: {
      description: 'The chain id to connect to for Botanix',
      type: 'number',
      default: 3637,
      sensitive: false,
    },
    AVALANCHE_RPC_URL: {
      description: 'RPC url of Avalanche node',
      type: 'string',
      sensitive: false,
    },
    AVALANCHE_CHAIN_ID: {
      description: 'The chain id to connect to for Avalanche',
      type: 'number',
      default: 43114,
      sensitive: false,
    },
    ARBITRUM_DATASTORE_CONTRACT_ADDRESS: {
      description: 'Address of Data Store contract on Arbitrum',
      type: 'string',
      default: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
      sensitive: false,
    },
    BOTANIX_DATASTORE_CONTRACT_ADDRESS: {
      description: 'Address of Data Store contract on Botanix',
      type: 'string',
      default: '0xA23B81a89Ab9D7D89fF8fc1b5d8508fB75Cc094d',
      sensitive: false,
    },
    AVALANCHE_DATASTORE_CONTRACT_ADDRESS: {
      description: 'Address of Data Store contract on Avalanche',
      type: 'string',
      default: '0x2F0b22339414ADeD7D5F06f9D604c7fF5b2fe3f6',
      sensitive: false,
    },
    ARBITRUM_GM_READER_CONTRACT_ADDRESS: {
      description: 'Address of GM Reader contract on Arbitrum',
      type: 'string',
      default: '0x470fbC46bcC0f16532691Df360A07d8Bf5ee0789',
      sensitive: false,
    },
    BOTANIX_GM_READER_CONTRACT_ADDRESS: {
      description: 'Address of GM Reader contract on Botanix',
      type: 'string',
      default: '0x922766ca6234cD49A483b5ee8D86cA3590D0Fb0E',
      sensitive: false,
    },
    AVALANCHE_GM_READER_CONTRACT_ADDRESS: {
      description: 'Address of GM Reader contract on Avalanche',
      type: 'string',
      default: '0x62Cb8740E6986B29dC671B2EB596676f60590A5B',
      sensitive: false,
    },
    ARBITRUM_GLV_READER_CONTRACT_ADDRESS: {
      description: 'Address of GLV Reader contract on Arbitrum',
      type: 'string',
      default: '0x2C670A23f1E798184647288072e84054938B5497',
      sensitive: false,
    },
    BOTANIX_GLV_READER_CONTRACT_ADDRESS: {
      description: 'Address of GLV Reader contract on Botanix',
      type: 'string',
      default: '0x955Aa50d2ecCeffa59084BE5e875eb676FfAFa98',
      sensitive: false,
    },
    AVALANCHE_GLV_READER_CONTRACT_ADDRESS: {
      description: 'Address of GLV Reader contract on Avalanche',
      type: 'string',
      default: '0x5C6905A3002f989E1625910ba1793d40a031f947',
      sensitive: false,
    },
    ARBITRUM_TOKENS_INFO_URL: {
      description: 'URL to token metadata supported by GMX on Arbitrum',
      type: 'string',
      required: true,
      default: 'https://arbitrum-api.gmxinfra.io/tokens',
      sensitive: false,
    },
    BOTANIX_TOKENS_INFO_URL: {
      description: 'URL to token metadata supported by GMX on Botanix',
      type: 'string',
      default: 'https://botanix-api.gmxinfra.io/tokens',
      sensitive: false,
    },
    AVALANCHE_TOKENS_INFO_URL: {
      description: 'URL to token metadata supported by GMX on Avalanche',
      type: 'string',
      default: 'https://avalanche-api.gmxinfra.io/tokens',
      sensitive: false,
    },
    ARBITRUM_MARKETS_INFO_URL: {
      description: 'URL to market metadata supported by GMX on Arbitrum',
      type: 'string',
      default: 'https://arbitrum-api.gmxinfra.io/markets',
      sensitive: false,
    },
    BOTANIX_MARKETS_INFO_URL: {
      description: 'URL to market metadata supported by GMX on Botanix',
      type: 'string',
      default: 'https://botanix-api.gmxinfra.io/markets',
      sensitive: false,
    },
    AVALANCHE_MARKETS_INFO_URL: {
      description: 'URL to market metadata supported by GMX on Avalanche',
      type: 'string',
      default: 'https://avalanche-api.gmxinfra.io/markets',
      sensitive: false,
    },
    GLV_INFO_API_TIMEOUT_MS: {
      description:
        'Timeout for metadata API requests. Distinct from API_TIMEOUT used for provider requests.',
      type: 'number',
      default: 10_000,
      sensitive: false,
    },
    METADATA_REFRESH_INTERVAL_MS: {
      description: 'How often metadata should be refreshed from GMX APIs',
      type: 'number',
      default: 60 * 60 * 3 * 1000,
      sensitive: false,
    },
    PNL_FACTOR_TYPE: {
      description:
        'PnL factor type. See https://github.com/gmx-io/gmx-synthetics#market-token-price',
      type: 'string',
      required: true,
      default: 'MAX_PNL_FACTOR_FOR_TRADERS',
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
