import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETHEREUM_RPC_URL: {
    description: 'RPC URL of a Mainnet ETH node',
    type: 'string',
    required: true,
  },
  DATA_ENGINE_ADAPTER_URL: {
    description: 'URL of data engine ea',
    type: 'string',
    default: '',
  },
  TRADING_HOURS_ADAPTER_URL: {
    description: 'URL of tradinghours ea',
    type: 'string',
    default: '',
  },
  DATA_ENGINE_EA_URL: {
    description: 'Deprecated: use DATA_ENGINE_ADAPTER_URL instead',
    type: 'string',
    default: '',
  },
  ETHEREUM_RPC_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
  },

  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
  },
})
