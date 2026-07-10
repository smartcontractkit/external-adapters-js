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
    prevout: { scriptpubkey_address: string; value: number }
  }>
}

const joinUrl = (base: string, path: string): string => {
  const url = new URL(base)
  url.pathname = url.pathname.replace(/\/$/, '') + path
  return url.toString()
}

const getConfirmations = (utxo: UTXO, blockHeight: number): number => {
  if (!utxo.status.confirmed || !utxo.status.block_height) return 0
  return blockHeight - utxo.status.block_height + 1
}

const sumConfirmedUtxos = (utxos: UTXO[], blockHeight: number, minConfirmations: number): bigint =>
  utxos
    .filter((utxo) => getConfirmations(utxo, blockHeight) >= minConfirmations)
    .reduce((sum, utxo) => sum + BigInt(utxo.value), 0n)

const sumPendingSpendInputs = (mempoolTxs: MempoolTransaction[], address: string): bigint => {
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

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize)
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
        const pending = sumPendingSpendInputs(mempoolResponse.response.data, address)
        return confirmed + pending
      }),
    )

    for (const reserves of batchTotals) {
      totalReserves += reserves
    }
  }

  return totalReserves
}
