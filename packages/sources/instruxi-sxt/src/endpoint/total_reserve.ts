import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { totalReserveTransport } from '../transport/total_reserve'

export const inputParameters = new InputParameters(
  {
    BISCUIT_ATTESTATIONS: {
      description: 'Access biscuit for attestations table',
      type: 'string',
      required: true,
    },
    BISCUIT_BLOCKCHAINS: {
      description: 'Access biscuit for blockchains table',
      type: 'string',
      required: true,
    },
    CHAIN_ID: {
      description: 'Specify a chain ID',
      type: 'string',
      required: true,
    },
    ASSET_CONTRACT_ADDRESS: {
      type: 'string',
      description: 'NFT contract address associated with the coin',
      required: true,
    },
    TOKEN_CONTRACT_ADDRESS: {
      type: 'string',
      description: 'NFT contract address associated with the coin',
      required: true,
    },
    NAMESPACE: {
      type: 'string',
      description: 'SxT namespace',
      required: true,
    },
  },
  [
    {
      BISCUIT_ATTESTATIONS: 'example_biscuit_attestations',
      BISCUIT_BLOCKCHAINS: 'example_biscuit_blockchains',
      CHAIN_ID: 'example_chainId',
      ASSET_CONTRACT_ADDRESS: 'example contract address',
      TOKEN_CONTRACT_ADDRESS: 'example token contract address',
      NAMESPACE: 'SxT namespace',
    },
  ],
)

export const endpoint = new AdapterEndpoint({
  name: 'total_reserve',
  transport: totalReserveTransport,
  inputParameters,
})
