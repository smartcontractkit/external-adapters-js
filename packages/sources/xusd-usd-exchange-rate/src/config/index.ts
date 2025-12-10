import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  ETHEREUM_RPC_URL: {
    description: 'Ethereum JSON-RPC endpoint URL provided by the node operator',
    type: 'string',
    required: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
