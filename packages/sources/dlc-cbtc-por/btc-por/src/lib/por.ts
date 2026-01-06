import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { MempoolTransaction, UTXO } from './types'

const logger = makeLogger('BtcPor')

/**
 * Builds a URL by appending a path to a base endpoint.
 * Properly handles base URLs that already contain query parameters.
 *
 * API keys are typically specified as query parameters in the base URL:
 *   - Path-based auth: "https://api.example.com/SECRET_KEY"
 *   - Query param auth: "https://api.example.com?auth=TOKEN"
 *
 * Both formats are preserved when paths are appended.
 *
 * Examples:
 *   buildUrl("https://api.example.com", "/blocks/tip/height")
 *     => "https://api.example.com/blocks/tip/height"
 *
 *   buildUrl("https://api.example.com/electrs?auth=TOKEN", "/blocks/tip/height")
 *     => "https://api.example.com/electrs/blocks/tip/height?auth=TOKEN"
 */
export function buildUrl(baseEndpoint: string, path: string): string {
  const url = new URL(baseEndpoint)
  // Append path to existing pathname (ensuring no double slashes)
  url.pathname = url.pathname.replace(/\/$/, '') + path
  return url.toString()
}

/**
 * Validates that a value is a number
 */
function validateNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${context}: expected number, got ${typeof value}`)
  }
  return value
}

/**
 * Validates UTXO response from Electrs API
 */
function validateUtxoResponse(data: unknown, address: string): UTXO[] {
  if (!Array.isArray(data)) {
    throw new Error(`Invalid UTXO response for ${address}: expected array`)
  }

  return data.map((item, i) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid UTXO at index ${i} for ${address}`)
    }

    const utxo = item as Record<string, unknown>

    if (typeof utxo.txid !== 'string') {
      throw new Error(`Invalid UTXO txid at index ${i} for ${address}`)
    }
    if (typeof utxo.vout !== 'number') {
      throw new Error(`Invalid UTXO vout at index ${i} for ${address}`)
    }
    if (typeof utxo.value !== 'number') {
      throw new Error(`Invalid UTXO value at index ${i} for ${address}`)
    }
    if (!utxo.status || typeof utxo.status !== 'object') {
      throw new Error(`Invalid UTXO status at index ${i} for ${address}`)
    }

    return item as UTXO
  })
}

/**
 * Validates mempool transaction response from Electrs API
 */
function validateMempoolResponse(data: unknown, address: string): MempoolTransaction[] {
  if (!Array.isArray(data)) {
    throw new Error(`Invalid mempool response for ${address}: expected array`)
  }

  return data.map((item, i) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid mempool tx at index ${i} for ${address}`)
    }

    const tx = item as Record<string, unknown>

    if (typeof tx.txid !== 'string') {
      throw new Error(`Invalid mempool tx txid at index ${i} for ${address}`)
    }
    if (!Array.isArray(tx.vin)) {
      throw new Error(`Invalid mempool tx vin at index ${i} for ${address}`)
    }

    return item as MempoolTransaction
  })
}

/** Fetches current Bitcoin block height from Electrs API */
export async function fetchBlockHeight(endpoint: string): Promise<number> {
  const url = buildUrl(endpoint, '/blocks/tip/height')
  logger.debug(`Fetching block height from ${url}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch block height: HTTP ${response.status}`)
  }

  const data = await response.json()
  return validateNumber(data, 'Block height response')
}

/** Fetches confirmed & unconfirmed UTXOs for a Bitcoin address via Electrs API */
export async function fetchAddressUtxos(endpoint: string, address: string): Promise<UTXO[]> {
  const url = buildUrl(endpoint, `/address/${address}/utxo`)
  logger.debug(`Fetching UTXOs for ${address}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch UTXOs for ${address}: HTTP ${response.status}`)
  }

  const data = await response.json()
  return validateUtxoResponse(data, address)
}

/** Fetches unconfirmed (mempool) transactions for an address */
export async function fetchMempoolTransactions(
  endpoint: string,
  address: string,
): Promise<MempoolTransaction[]> {
  const url = buildUrl(endpoint, `/address/${address}/txs/mempool`)
  logger.debug(`Fetching mempool transactions for ${address}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch mempool txs for ${address}: HTTP ${response.status}`)
  }

  const data = await response.json()
  return validateMempoolResponse(data, address)
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
 * Sums confirmed UTXOs that meet the minimum confirmation requirement.
 * Uses BigInt to prevent overflow when summing large amounts across many addresses.
 * Pure function for testing.
 */
export function sumConfirmedUtxos(
  utxos: UTXO[],
  currentBlockHeight: number,
  minConfirmations: number,
): bigint {
  return utxos
    .filter((utxo) => hasMinConfirmations(utxo, currentBlockHeight, minConfirmations))
    .reduce((sum, utxo) => sum + BigInt(utxo.value), 0n)
}

/**
 * Sums pending spend input values from mempool transactions.
 * When a UTXO is spent but unconfirmed, we add back its value to prevent balance dips.
 * Uses BigInt to prevent overflow. Pure function for testing.
 */
export function sumPendingSpendInputs(mempoolTxs: MempoolTransaction[], address: string): bigint {
  let total = 0n
  for (const tx of mempoolTxs) {
    for (const input of tx.vin) {
      if (input.prevout.scriptpubkey_address === address) {
        total += BigInt(input.prevout.value)
      }
    }
  }
  return total
}

/**
 * Calculates reserves for a single address:
 * 1. Sum confirmed UTXOs with sufficient confirmations
 * 2. Add pending spend inputs to prevent balance dips during unconfirmed spends
 */
export async function calculateAddressReserves(
  endpoint: string,
  address: string,
  currentBlockHeight: number,
  minConfirmations: number,
): Promise<bigint> {
  // Fetch all UTXOs for the address
  const utxos = await fetchAddressUtxos(endpoint, address)
  const confirmedBalance = sumConfirmedUtxos(utxos, currentBlockHeight, minConfirmations)

  // Fetch pending (mempool) transactions
  const mempoolTxs = await fetchMempoolTransactions(endpoint, address)
  const pendingSpendValue = sumPendingSpendInputs(mempoolTxs, address)

  const total = confirmedBalance + pendingSpendValue

  logger.debug(
    `Address ${address}: confirmed=${confirmedBalance} sats, pendingSpend=${pendingSpendValue} sats, total=${total} sats`,
  )

  return total
}

/** Batch size for parallel address processing to avoid overwhelming the API */
const ADDRESS_BATCH_SIZE = 10

/**
 * Calculates total reserves across all vault addresses.
 * Processes addresses in parallel batches for performance.
 * Returns BigInt to handle large totals without overflow.
 */
export async function calculateReserves(
  endpoint: string,
  addresses: string[],
  minConfirmations: number,
): Promise<bigint> {
  const currentBlockHeight = await fetchBlockHeight(endpoint)
  logger.info(
    `Calculating reserves: ${addresses.length} addresses, block height ${currentBlockHeight}`,
  )

  let totalReserves = 0n

  // Process addresses in parallel batches
  for (let i = 0; i < addresses.length; i += ADDRESS_BATCH_SIZE) {
    const batch = addresses.slice(i, i + ADDRESS_BATCH_SIZE)
    const results = await Promise.all(
      batch.map((address) =>
        calculateAddressReserves(endpoint, address, currentBlockHeight, minConfirmations),
      ),
    )

    for (const reserves of results) {
      totalReserves += reserves
    }

    logger.debug(
      `Processed batch ${Math.floor(i / ADDRESS_BATCH_SIZE) + 1}: ${batch.length} addresses`,
    )
  }

  logger.info(`Total reserves: ${totalReserves} sats across ${addresses.length} addresses`)
  return totalReserves
}
