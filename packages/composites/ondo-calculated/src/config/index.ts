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
})
