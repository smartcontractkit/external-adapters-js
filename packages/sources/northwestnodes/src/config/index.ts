import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const defaultEndpoint = 'staking_ethereum_epoch_single'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'The Northwest Nodes API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'The default HTTP API base url',
    type: 'string',
    required: false,
    default: 'https://api.northwestnodes.com',
  },
})
