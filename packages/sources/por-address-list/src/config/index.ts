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
  COINBASE_CBBTC_API_ENDPOINT: {
    description: 'An API endpoint for Coinbase cbBTC native BTC wallet address',
    type: 'string',
    default: 'https://coinbase.com/cbbtc/proof-of-reserves.json',
  },
  BEDROCK_UNIBTC_API_ENDPOINT: {
    description: 'An API endpoint for Bedrock uniBTC native BTC wallet address',
    type: 'string',
    default: 'https://bedrock-datacenter.rockx.com/data/tvl/reserve_with_native.json',
  },
  SOLVBTC_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC native BTC wallet address',
    type: 'string',
    default: 'https://por.sft-api.com/solv-btc-addresses.json',
  },
  SOLVBTC_BBN_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC.BBN native BTC wallet address',
    type: 'string',
    default: 'https://por.sft-api.com/x-solv-btc-addresses.json',
  },
  SOLVBTC_ENA_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC.ENA native BTC wallet address. Deprecated',
    type: 'string',
    default: 'https://por.sft-api.com/solv-btc-ena-addresses.json',
  },
  SOLVBTC_TRADING_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC.TRADING native BTC wallet address',
    type: 'string',
    default: 'https://por.sft-api.com/solv-btc-trading-addresses.json',
  },
  SOLVBTC_CORE_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC.CORE native BTC wallet address',
    type: 'string',
    default: 'https://por.sft-api.com/solv-btc-core-addresses.json',
  },
  SOLVBTC_JUP_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC.JUP MirrorX AccountIDs on CEFFU',
    type: 'string',
    default: 'https://por.sft-api.com/solv-btc-jup-mirrorx.json',
  },
  ZEUS_ZBTC_API_URL: {
    description: 'An API endpoint for Zeus native BTC wallet address',
    type: 'string',
    default: 'https://indexer.zeuslayer.io/api/v2/chainlink/proof-of-reserves',
  },
  VIRTUNE_API_URL: {
    description: 'An API endpoint for Virtune address lists',
    type: 'string',
    default:
      'https://proof-of-reserves-chainlink-283003lt.nw.gateway.dev/api/external/proof-of-reserves',
  },
  VIRTUNE_API_KEY: {
    description: 'The API key for Virtune address list API',
    type: 'string',
    default: '',
  },
})
