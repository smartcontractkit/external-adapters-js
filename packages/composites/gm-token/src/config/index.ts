import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

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
    BOTANIX_RPC_URL: {
      description: 'RPC url of Botanix node',
      type: 'string',
      sensitive: false,
    },
    BOTANIX_CHAIN_ID: {
      description: 'The chain id to connect to',
      type: 'number',
      default: 3637,
      sensitive: false,
    },
    DATASTORE_CONTRACT_ADDRESS: {
      description: 'Address of Data Store contract',
      type: 'string',
      required: true,
      default: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
      sensitive: false,
    },
    BOTANIX_DATASTORE_CONTRACT_ADDRESS: {
      description: 'Address of Data Store contract',
      type: 'string',
      required: true,
      default: '0xA23B81a89Ab9D7D89fF8fc1b5d8508fB75Cc094d',
      sensitive: false,
    },
    READER_CONTRACT_ADDRESS: {
      description: 'Address of Reader contract on Arbitrum',
      type: 'string',
      required: true,
      default: '0x470fbC46bcC0f16532691Df360A07d8Bf5ee0789',
      sensitive: false,
    },
    BOTANIX_READER_CONTRACT_ADDRESS: {
      description: 'Address of Reader contract on Botanix',
      type: 'string',
      required: true,
      default: '0x922766ca6234cD49A483b5ee8D86cA3590D0Fb0E',
      sensitive: false,
    },
    ARBITRUM_TOKENS_INFO_URL: {
      description: 'URL to token meta data supported by GMX on Arbitrum',
      type: 'string',
      required: true,
      default: 'https://arbitrum-api.gmxinfra.io/tokens',
      sensitive: false,
    },
    BOTANIX_TOKENS_INFO_URL: {
      description: 'URL to token meta data supported by GMX on Botanix',
      type: 'string',
      required: true,
      default: 'https://botanix-api.gmxinfra.io/tokens',
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
    TIINGO_ADAPTER_URL: {
      description: 'URL of Tiingo EA',
      type: 'string',
      required: false,
      sensitive: false,
    },
    NCFX_ADAPTER_URL: {
      description: 'URL of NCFX EA',
      type: 'string',
      required: false,
      sensitive: false,
    },
    COINMETRICS_ADAPTER_URL: {
      description: 'URL of Coinmetrics EA',
      type: 'string',
      required: false,
      sensitive: false,
    },
    BLOCKSIZE_CAPITAL_ADAPTER_URL: {
      description: 'URL of Blocksize Capital EA',
      type: 'string',
      required: false,
      sensitive: false,
    },
    MIN_REQUIRED_SOURCE_SUCCESS: {
      description: 'Minimum number of source EAs that need to successfully return a value.',
      type: 'number',
      required: true,
      default: 2,
      validate: validator.integer({ min: 1, max: 3 }),
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
