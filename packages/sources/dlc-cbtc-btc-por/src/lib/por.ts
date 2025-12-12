import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('CbtcPor')

export interface UTXO {
  txid: string
  vout: number
  value: number
  status: {
    confirmed: boolean
    block_height?: number
  }
}

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

/** Fetches current Bitcoin block height from Electrs API */
export async function fetchBlockHeight(endpoint: string): Promise<number> {
  const url = `${endpoint}/blocks/tip/height`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch block height: ${response.status}`)
  }

  return response.json() as Promise<number>
}

/** Fetches confirmed & unconfirmed UTXOs for a Bitcoin address via Electrs API */
export async function fetchAddressUtxos(endpoint: string, address: string): Promise<UTXO[]> {
  const url = `${endpoint}/address/${address}/utxo`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch UTXOs for ${address}: ${response.status}`)
  }

  return response.json() as Promise<UTXO[]>
}

/** Fetches unconfirmed (mempool) transactions for an address */
export async function fetchMempoolTransactions(
  endpoint: string,
  address: string,
): Promise<MempoolTransaction[]> {
  const url = `${endpoint}/address/${address}/txs/mempool`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch mempool txs for ${address}: ${response.status}`)
  }

  return response.json() as Promise<MempoolTransaction[]>
}

/** Checks if a UTXO has enough confirmations */
function hasMinConfirmations(
  utxo: UTXO,
  currentBlockHeight: number,
  minConfirmations: number,
): boolean {
  if (!utxo.status.confirmed || !utxo.status.block_height) {
    return false
  }
  const confirmations = currentBlockHeight - utxo.status.block_height + 1
  return confirmations >= minConfirmations
}

/**
 * Calculates reserves for a single address
 * 1. Sum confirmed UTXOs with sufficient confirmations
 * 2. For pending spends to another address, add the input value being spent to the reserves until it is confirmed
 */
export async function calculateAddressReserves(
  endpoint: string,
  address: string,
  currentBlockHeight: number,
  minConfirmations: number,
): Promise<number> {
  // Fetch all UTXOs for the address
  const utxos = await fetchAddressUtxos(endpoint, address)

  // Sum confirmed UTXOs with sufficient confirmations
  const confirmedBalance = utxos
    .filter((utxo) => hasMinConfirmations(utxo, currentBlockHeight, minConfirmations))
    .reduce((sum, utxo) => sum + utxo.value, 0)

  // Get pending (mempool) transactions for this address
  const mempoolTxs = await fetchMempoolTransactions(endpoint, address)

  // Find pending transactions that spend from this address and add the input value to the reserves until it is confirmed
  let pendingSpendValue = 0
  for (const tx of mempoolTxs) {
    for (const input of tx.vin) {
      if (input.prevout.scriptpubkey_address === address) {
        pendingSpendValue += input.prevout.value
        logger.debug(
          `Address ${address}: pending spend of ${input.prevout.value} sats (txid: ${tx.txid})`,
        )
      }
    }
  }

  // The total reserve balance is the sum of all confirmed and unconfirmed UTXOs. A balance is only reduced when a UTXO is spent and confirmed
  const total = confirmedBalance + pendingSpendValue
  logger.debug(
    `Address ${address}: ${confirmedBalance} sats confirmed, ${pendingSpendValue} sats pending spend, ${total} sats total`,
  )

  return total
}

/** Calculates total reserves across all vault addresses */
export async function calculateReserves(
  endpoint: string,
  addresses: string[],
  minConfirmations: number,
): Promise<number> {
  const currentBlockHeight = await fetchBlockHeight(endpoint)
  logger.debug(`Current block height: ${currentBlockHeight}`)

  let totalReserves = 0
  for (const address of addresses) {
    const addressReserves = await calculateAddressReserves(
      endpoint,
      address,
      currentBlockHeight,
      minConfirmations,
    )
    totalReserves += addressReserves
  }

  return totalReserves
}
