import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  BEDROCK_UNIBTC_API_ENDPOINT: {
    description: 'An API endpoint for Bedrock uniBTC native BTC wallet address',
    type: 'string',
    default: 'https://bedrock-datacenter.rockx.com/uniBTC/reserve/address',
  },
  SOLVBTC_API_ENDPOINT: {
    description: 'An API endpoint for SolvBTC native BTC wallet address',
    type: 'string',
    default: 'https://solv-btcaddress-test.s3.us-east-1.amazonaws.com/solv-btc-addresses.json',
  },
})
