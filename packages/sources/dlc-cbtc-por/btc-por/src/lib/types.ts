/**
 * Type definitions for the DLC.Link Attester API and Bitcoin address calculation
 */

/** Individual address info for a single deposit account */
export interface AddressInfo {
  /** Deposit account ID (hex string from Canton) */
  id: string
  /** Bitcoin P2TR address for verification */
  address_for_verification: string
}

/** Group of addresses sharing the same xpub (one per Canton chain) */
export interface ChainAddressGroup {
  /** Canton network name (e.g., "devnet", "mainnet") */
  chain: string
  /** BIP32 extended public key (already derived to m/0/0) */
  xpub: string
  /** All deposit accounts on this chain */
  addresses: AddressInfo[]
}

/** Top-level API response from /app/get-address-calculation-data */
export interface AttesterAddressResponse {
  /** Array of chain groups */
  chains: ChainAddressGroup[]
  /** Bitcoin network: "mainnet", "testnet", or "regtest" */
  bitcoin_network: string
}

/** UTXO data structure from Electrs API */
export interface UTXO {
  txid: string
  vout: number
  value: number
  status: {
    confirmed: boolean
    block_height?: number
  }
}

/** Mempool transaction structure from Electrs API */
export interface MempoolTransaction {
  txid: string
  vin: Array<{
    txid: string
    vout: number
    prevout: {
      scriptpubkey_address: string
      value: number
    }
  }>
  vout: Array<{
    scriptpubkey_address: string
    value: number
  }>
}
