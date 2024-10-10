import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import dotenv from 'dotenv'
dotenv.config()

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    required: true,
    default: process.env.API_ENDPOINT,
  },
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    sensitive: true,
    required: true,
    default: process.env.API_KEY,
  },
  BISCUIT_ATTESTATIONS: {
    description: 'Access biscuit for attestations table',
    type: 'string',
    sensitive: true,
    required: true,
    default: process.env.BISCUIT_ATTESTATIONS,
  },
  BISCUIT_BLOCKCHAINS: {
    description: 'Access biscuit for blockchains table',
    type: 'string',
    sensitive: true,
    required: true,
    default: process.env.BISCUIT_BLOCKCHAINS,
  },
  CHAIN_ID: {
    description: 'Specify a chain ID',
    type: 'string',
    sensitive: true,
    required: true,
    default: process.env.CHAIN_ID,
  },
  ASSET_CONTRACT_ADDRESS: {
    type: 'string',
    description: 'NFT contract address associated witht the coin',
    sensitive: true,
    required: true,
    default: process.env.ASSET_CONTRACT_ADDRESS,
  },
  TOKEN_CONTRACT_ADDRESS: {
    type: 'string',
    description: 'NFT contract address associated witht the coin',
    sensitive: true,
    required: true,
    default: process.env.TOKEN_CONTRACT_ADDRESS,
  },
  NAMESPACE: {
    type: 'string',
    description: 'SxT nasmespace',
    sensitive: true,
    required: true,
    default: process.env.NAMESPACE,
  },
})
