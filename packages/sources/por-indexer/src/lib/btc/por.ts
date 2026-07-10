import { Requester } from '@chainlink/external-adapter-framework/util/requester'

type UTXO = {
  txid: string
  vout: number
  value: number
  status: { confirmed: boolean; block_height?: number }
}

type MempoolTransaction = {
  txid: string
  vin: Array<{
    txid: string
    vout: number
    prevout: { scriptpubkey_address: string; value: number }
  }>
}

type TxStatus = {
  confirmed: boolean
  block_height?: number
}

const MAX_STREAMS_ADDRESS_BATCH_SIZE = 10

const joinUrl = (base: string, path: string): string => {
  const url = new URL(base)
  url.pathname = url.pathname.replace(/\/$/, '') + path
  return url.toString()
}

const getConfirmations = (status: TxStatus, blockHeight: number): number => {
  if (!status.confirmed || !status.block_height) return 0
  return blockHeight - status.block_height + 1
}

const sumConfirmedUtxos = (utxos: UTXO[], blockHeight: number, minConfirmations: number): bigint =>
  utxos
    .filter((utxo) => getConfirmations(utxo.status, blockHeight) >= minConfirmations)
    .reduce((sum, utxo) => sum + BigInt(utxo.value), 0n)

const fetchTxStatus = async (
  requester: Requester,
  endpoint: string,
  txid: string,
): Promise<TxStatus> => {
  const txStatusResponse = await requester.request<TxStatus>(
    joinUrl(endpoint, `/tx/${txid}/status`),
    {
      url: joinUrl(endpoint, `/tx/${txid}/status`),
    },
  )
  return txStatusResponse.response.data
}

const sumPendingSpendInputs = async (
  requester: Requester,
  endpoint: string,
  mempoolTxs: MempoolTransaction[],
  address: string,
  blockHeight: number,
  minConfirmations: number,
): Promise<bigint> => {
  const matchingInputs = mempoolTxs.flatMap((tx) =>
    tx.vin.filter((input) => input.prevout.scriptpubkey_address === address),
  )

  if (matchingInputs.length === 0) {
    return 0n
  }

  if (minConfirmations <= 0) {
    return matchingInputs.reduce((sum, input) => sum + BigInt(input.prevout.value), 0n)
  }

  const txStatusById = new Map<string, Promise<TxStatus>>()
  const eligiblePendingSpends = await Promise.all(
    matchingInputs.map(async (input) => {
      let txStatusPromise = txStatusById.get(input.txid)
      if (!txStatusPromise) {
        txStatusPromise = fetchTxStatus(requester, endpoint, input.txid)
        txStatusById.set(input.txid, txStatusPromise)
      }

      const txStatus = await txStatusPromise
      return getConfirmations(txStatus, blockHeight) >= minConfirmations
        ? BigInt(input.prevout.value)
        : 0n
    }),
  )

  let total = 0n
  for (const value of eligiblePendingSpends) {
    total += value
  }
  return total
}

export async function calculateReserves(
  requester: Requester,
  endpoint: string,
  addresses: string[],
  minConfirmations: number,
  batchSize: number,
): Promise<bigint> {
  const blockHeightResponse = await requester.request<number>(
    joinUrl(endpoint, '/blocks/tip/height'),
    {
      url: joinUrl(endpoint, '/blocks/tip/height'),
    },
  )
  const blockHeight = blockHeightResponse.response.data as number

  let totalReserves = 0n
  const addressBatchSize = Math.max(1, Math.min(batchSize, MAX_STREAMS_ADDRESS_BATCH_SIZE))

  for (let i = 0; i < addresses.length; i += addressBatchSize) {
    const batch = addresses.slice(i, i + addressBatchSize)
    const batchTotals = await Promise.all(
      batch.map(async (address) => {
        const utxoResponse = await requester.request<UTXO[]>(
          joinUrl(endpoint, `/address/${address}/utxo`),
          { url: joinUrl(endpoint, `/address/${address}/utxo`) },
        )
        const mempoolResponse = await requester.request<MempoolTransaction[]>(
          joinUrl(endpoint, `/address/${address}/txs/mempool`),
          { url: joinUrl(endpoint, `/address/${address}/txs/mempool`) },
        )

        const confirmed = sumConfirmedUtxos(
          utxoResponse.response.data,
          blockHeight,
          minConfirmations,
        )
        const pending = await sumPendingSpendInputs(
          requester,
          endpoint,
          mempoolResponse.response.data,
          address,
          blockHeight,
          minConfirmations,
        )
        return confirmed + pending
      }),
    )

    for (const reserves of batchTotals) {
      totalReserves += reserves
    }
  }

  return totalReserves
}
