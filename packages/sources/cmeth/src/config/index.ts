import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETHEREUM_RPC_URL: {
    description: 'RPC url of Ethereum node',
    type: 'string',
    required: true,
  },
  ETHEREUM_RPC_CHAIN_ID: {
    description: 'Ethereum chain id',
    type: 'number',
    default: 1,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
