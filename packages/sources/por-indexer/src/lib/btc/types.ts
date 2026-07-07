/** UTXO data structure from Electrs-compatible streams Bitcoin indexer API */
export interface UTXO {
  txid: string
  vout: number
  value: number
  status: {
    confirmed: boolean
    block_height?: number
  }
}

/** Mempool transaction structure from Electrs-compatible streams Bitcoin indexer API */
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
