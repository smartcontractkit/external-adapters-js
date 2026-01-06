import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { MempoolTransaction, UTXO } from './types'

const logger = makeLogger('CbtcPor')

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

/**
 * Calculates the number of confirmations for a UTXO
 * Returns 0 for unconfirmed UTXOs
 */
export function getConfirmations(utxo: UTXO, currentBlockHeight: number): number {
  if (!utxo.status.confirmed || !utxo.status.block_height) {
    return 0
  }
  return currentBlockHeight - utxo.status.block_height + 1
}

/** Checks if a UTXO has enough confirmations */
export function hasMinConfirmations(
  utxo: UTXO,
  currentBlockHeight: number,
  minConfirmations: number,
): boolean {
  return getConfirmations(utxo, currentBlockHeight) >= minConfirmations
}

/**
 * Sums confirmed UTXOs that meet the minimum confirmation requirement
 * Pure function for testing
 */
export function sumConfirmedUtxos(
  utxos: UTXO[],
  currentBlockHeight: number,
  minConfirmations: number,
): number {
  return utxos
    .filter((utxo) => hasMinConfirmations(utxo, currentBlockHeight, minConfirmations))
    .reduce((sum, utxo) => sum + utxo.value, 0)
}

/**
 * Sums pending spend input values from mempool transactions
 * When a UTXO is spent but unconfirmed, we add back its value to prevent balance dips
 * Pure function for testing
 */
export function sumPendingSpendInputs(mempoolTxs: MempoolTransaction[], address: string): number {
  let total = 0
  for (const tx of mempoolTxs) {
    for (const input of tx.vin) {
      if (input.prevout.scriptpubkey_address === address) {
        total += input.prevout.value
      }
    }
  }
  return total
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
  const confirmedBalance = sumConfirmedUtxos(utxos, currentBlockHeight, minConfirmations)

  // Get pending (mempool) transactions for this address
  const mempoolTxs = await fetchMempoolTransactions(endpoint, address)

  // Find pending transactions that spend from this address and add the input value to the reserves until it is confirmed
  const pendingSpendValue = sumPendingSpendInputs(mempoolTxs, address)

  if (pendingSpendValue > 0) {
    logger.debug(`Address ${address}: pending spend of ${pendingSpendValue} sats`)
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
