import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETHEREUM_RPC_URL: {
    description: 'RPC URL of a Mainnet ETH node',
    type: 'string',
    required: true,
  },
  ETHEREUM_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
  },
})
