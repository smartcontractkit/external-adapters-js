import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  APTOS_URL: {
    description: 'Aptos rest api url',
    type: 'string',
    required: false,
    default: '',
  },
  APTOS_TESTNET_URL: {
    description: 'Aptos testnet rest api url',
    type: 'string',
    required: false,
    default: '',
  },
  GROUP_SIZE: {
    description:
      'Number of requests to execute asynchronously before the adapter waits to execute the next group of requests.',
    type: 'number',
    default: 10,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
