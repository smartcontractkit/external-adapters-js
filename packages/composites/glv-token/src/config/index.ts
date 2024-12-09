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
    READER_CONTRACT_ADDRESS: {
      description: 'Address of Reader contract',
      type: 'string',
      required: true,
      default: '0xf60becbba223EEA9495Da3f606753867eC10d139',
    },
    GLV_READER_CONTRACT_ADDRESS: {
      description: 'Address of Glv Reader Contract',
      type: 'string',
      required: true,
      default: '0x6a9505D0B44cFA863d9281EA5B0b34cB36243b45',
    },
    PNL_FACTOR_TYPE: {
      description:
        'PnL factor type. See https://github.com/gmx-io/gmx-synthetics#market-token-price',
      type: 'string',
      required: true,
      default: 'MAX_PNL_FACTOR_FOR_TRADERS',
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
      default: 2,
      validate: validator.integer({ min: 1, max: 3 }),
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
