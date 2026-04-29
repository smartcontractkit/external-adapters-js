import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  APTOS_RPC_URL: {
    description: 'The Aptos fullnode REST API URL',
    type: 'string',
    required: true,
    sensitive: false,
  },
  DECIBEL_VAULT_MODULE_ADDRESS: {
    description: 'The Decibel vault module address on Aptos',
    type: 'string',
    required: true,
    default: '0x50ead22afd6ffd9769e3b3d6e0e64a2a350d68e8b102c4e72e33d0b8cfdfdb06',
    sensitive: false,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The number of milliseconds the background execute loop should sleep before performing the next iteration',
    type: 'number',
    default: 10_000,
  },
})
