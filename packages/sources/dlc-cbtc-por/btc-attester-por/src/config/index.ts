import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  BITCOIN_RPC_ENDPOINT: {
    description: 'Electrs-compatible Bitcoin blockchain API endpoint for UTXO queries',
    type: 'string',
    required: true,
  },
  VAULT_ADDRESSES: {
    description: 'Comma-separated list of Bitcoin vault addresses to query for reserves',
    type: 'string',
    required: true,
  },
  MIN_CONFIRMATIONS: {
    description: 'Minimum number of confirmations required for a UTXO to be counted',
    type: 'number',
    default: 6,
  },
})
