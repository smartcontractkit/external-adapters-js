import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETHEREUM_RPC_URL: {
    description: 'RPC URL for Ethereum mainnet',
    type: 'string',
    required: true,
  },
  ETHEREUM_CHAIN_ID: {
    description: 'Chain ID for Ethereum mainnet',
    type: 'number',
    default: 1,
  },
  PROOF_OF_RESERVES_ADAPTER_URL: {
    description: 'URL of the proof-of-reserves EA',
    type: 'string',
    required: true,
  },
  CUSD_CONTRACT_ADDRESS: {
    description: 'Address of the cUSD token contract on Ethereum',
    type: 'string',
    default: '0xcCcc62962d17b8914c62D74FfB843d73B2a3cccC',
  },
  POR_ADDRESS_LIST_CONTRACT: {
    description: 'Address of the CapChainlinkPoRAddressList contract on Ethereum',
    type: 'string',
    default: '0x69A22f0fc7b398e637BF830B862C75dd854b2BbF',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
