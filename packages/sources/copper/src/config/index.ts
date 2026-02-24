import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  COPPER_API_KEY: {
    description: 'Copper API key for authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
  COPPER_API_SECRET: {
    description: 'Copper API secret for HMAC signature generation',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'Copper platform API endpoint',
    type: 'string',
    default: 'https://api.copper.co/platform',
  },
  ETHEREUM_RPC_URL: {
    description: 'Ethereum RPC URL for reading Chainlink price feeds',
    type: 'string',
    required: true,
    sensitive: true,
  },
  ETHEREUM_CHAIN_ID: {
    description: 'Ethereum chain ID',
    type: 'number',
    default: 1,
  },
  BTC_USD_FEED_ADDRESS: {
    description: 'Chainlink BTC/USD price feed address on Ethereum mainnet',
    type: 'string',
    default: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  },
  ETH_USD_FEED_ADDRESS: {
    description: 'Chainlink ETH/USD price feed address on Ethereum mainnet',
    type: 'string',
    default: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  },
  SOL_USD_FEED_ADDRESS: {
    description: 'Chainlink SOL/USD price feed address on Ethereum mainnet',
    type: 'string',
    default: '0x4ffC43a60e009B551865A93d232E33Fce9f01507',
  },
  USDC_USD_FEED_ADDRESS: {
    description: 'Chainlink USDC/USD price feed address on Ethereum mainnet',
    type: 'string',
    default: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
  },
  USDT_USD_FEED_ADDRESS: {
    description: 'Chainlink USDT/USD price feed address on Ethereum mainnet',
    type: 'string',
    default: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
  },
  USYC_USD_FEED_ADDRESS: {
    description: 'Chainlink USYC/USD price feed address on Ethereum mainnet',
    type: 'string',
    required: true,
  },
  OUSG_USD_FEED_ADDRESS: {
    description: 'Chainlink OUSG/USD price feed address on Ethereum mainnet',
    type: 'string',
    required: true,
  },
  JTRSY_USD_FEED_ADDRESS: {
    description: 'Chainlink JTRSY/USD price feed address on Ethereum mainnet',
    type: 'string',
    required: true,
  },
  SUPERSTATE_API_ENDPOINT: {
    description: 'Superstate API endpoint for USTB NAV pricing',
    type: 'string',
    default: 'https://api.superstate.co',
  },
  USTB_FUND_ID: {
    description: 'Superstate USTB fund ID',
    type: 'number',
    default: 1,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10000,
  },
})
