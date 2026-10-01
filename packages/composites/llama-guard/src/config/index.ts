import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  SOURCE_EA_URL: {
    description:
      'URL of the ${SOURCE} external adapter where ${SOURCE} is the source input parameter',
    type: 'string',
    required: true,
    sensitive: false,
    variablePlaceholder: 'SOURCE',
  },
  ETHEREUM_RPC_URL: {
    description: 'RPC URL of a Mainnet ETH node',
    type: 'string',
    required: true,
    sensitive: false,
  },
  ETHEREUM_RPC_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
    sensitive: false,
  },
  LLAMA_RISK_API_ENDPOINT: {
    description: 'API endpoint for Llama Risk (contains API KEY)',
    type: 'string',
    default: '',
    sensitive: true,
  },

  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
    sensitive: false,
  },
})
