import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  APTOS_URL: {
    description: 'Aptos rest api url',
    type: 'string',
    required: false,
    default: '',
    sensitive: false,
  },
  APTOS_TESTNET_URL: {
    description: 'Aptos testnet rest api url',
    type: 'string',
    required: false,
    default: '',
    sensitive: false,
  },
  NETWORK_RPC_URL: {
    description:
      'The RPC URL for ${NETWORK} where ${NETWORK} is the upper-snake-case name of the `network` input parameter.',
    type: 'string',
    required: true,
    sensitive: true,
    variablePlaceholder: 'NETWORK',
  },
  NETWORK_CHAIN_ID: {
    description:
      'The chain ID for ${NETWORK} where ${NETWORK} is the upper-snake-case name of the `network` input parameter.',
    type: 'number',
    required: true,
    sensitive: false,
    variablePlaceholder: 'NETWORK',
  },
  GROUP_SIZE: {
    description:
      'Number of requests to execute asynchronously before the adapter waits to execute the next group of requests.',
    type: 'number',
    default: 10,
    sensitive: false,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
    sensitive: false,
  },
})
