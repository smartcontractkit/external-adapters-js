import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  STARKNET_RPC_URL: {
    description: 'RPC Url For Starknet',
    type: 'string',
    required: true,
    sensitive: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
