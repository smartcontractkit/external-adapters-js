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
  TRUMATIC_VAULT_SHARES_CONTRACT: {
    description: 'The address of the deployed TruMATIC Vault Shares contract',
    type: 'string',
    required: true,
    default: '0xA43A7c62D56dF036C187E1966c03E2799d8987ed',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The number of milliseconds the background execute should sleep before performing the next request',
    type: 'number',
    default: 1000,
  },
})
