import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    description:
      'The RPC URL to connect to the EVM chain the address manager contract is deployed to.',
    type: 'string',
    required: true,
  },
  CHAIN_ID: {
    description: 'The chain id to connect to for the RPC URL',
    type: 'number',
    default: 1,
  },
  GROUP_SIZE: {
    description:
      'The number of concurrent batched contract calls to make at a time. Setting this lower than the default may result in lower performance from the adapter.',
    type: 'number',
    default: 100,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
  BEDROCK_UNIBTC_API_ENDPOINT: {
    description: 'An API endpoint for Bedrock uniBTC native BTC wallet address',
    type: 'string',
    default: 'https://bedrock-datacenter.rockx.com/data/tvl/reserve_with_native.json',
  },
  SOLVBTC_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC native BTC wallet address',
    type: 'string',
    default: 'https://solv-btcaddress-test.s3.us-east-1.amazonaws.com/solv-btc-addresses.json',
  },
})
