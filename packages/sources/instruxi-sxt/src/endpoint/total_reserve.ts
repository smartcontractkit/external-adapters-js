import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { totalReserveTransport } from '../transport/total_reserve'

export const inputParameters = new InputParameters(
  {
    biscuit_attestation: {
      description: 'Access biscuit for attestations table',
      type: 'string',
      required: true,
    },
    biscuit_blockchains: {
      description: 'Access biscuit for blockchains table',
      type: 'string',
      required: true,
    },
    chain_id: {
      description: 'Specify a chain ID',
      type: 'string',
      required: true,
    },
    asset_contract_address: {
      type: 'string',
      description: 'NFT contract address associated with the coin',
      required: true,
    },
    token_contract_address: {
      type: 'string',
      description: 'NFT contract address associated with the coin',
      required: true,
    },
    namespace: {
      type: 'string',
      description: 'SxT namespace',
      required: true,
    },
  },
  [
    {
      biscuit_attestation: 'example_biscuit_attestations',
      biscuit_blockchains: 'example_biscuit_blockchains',
      chain_id: 'example_chainId',
      asset_contract_address: 'example contract address',
      token_contract_address: 'example token contract address',
      namespace: 'SxT namespace',
    },
  ],
)

export const endpoint = new AdapterEndpoint({
  name: 'total_reserve',
  transport: totalReserveTransport,
  inputParameters,
})
