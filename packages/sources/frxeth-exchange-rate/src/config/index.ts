import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    description: 'The RPC URL to connect to the EVM chain',
    type: 'string',
    required: true,
  },
  CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    required: true,
    default: 1,
  },
  FRAX_ETH_PRICE_CONTRACT: {
    description: 'The address of the deployed Frax Dual Oracle Price Logic contract',
    type: 'string',
    required: true,
    default: '0xb12c19c838499e3447afd9e59274b1be56b1546a',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The number of milliseconds the background execute should sleep before performing the next request',
    type: 'number',
    default: 1000,
  },
})
