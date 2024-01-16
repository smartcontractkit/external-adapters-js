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
    default: '0x350a9841956D8B0212EAdF5E14a449CA85FAE1C0',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The number of milliseconds the background execute should sleep before performing the next request',
    type: 'number',
    default: 1000,
  },
})
