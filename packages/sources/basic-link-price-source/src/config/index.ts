import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETH_RPC_URL: {
    description: 'RPC URL for Ethereum Mainnet',
    type: 'string',
    required: true,
  },
  ARB_RPC_URL: {
    description: 'RPC URL for Arbitrum One',
    type: 'string',
    required: true,
  },
  BACKGROUND_EXECUTE_MS: AdapterConfig.DEFAULT_BACKGROUND_EXECUTE_MS_WS,
  // Remove API_ENDPOINT if not using off-chain
})
