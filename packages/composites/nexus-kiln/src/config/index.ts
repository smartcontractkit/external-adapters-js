import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETH_BALANCE_ADAPTER_URL: {
    description: 'The location of a ETH balance adapter',
    type: 'string',
    required: true,
  },
  ETHEREUM_RPC_URL: {
    description: 'Ethereum RPC endpoint to get the needed on-chain data',
    type: 'string',
    required: true,
  },
  ETHEREUM_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
  },
  KILN_VALIDATOR_ADDRESSES_URL: {
    description: 'Graphql Endpoint to get list of validator id',
    type: 'string',
    default: 'https://api.studio.thegraph.com/query/72419/enzyme-core/version/latest',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
