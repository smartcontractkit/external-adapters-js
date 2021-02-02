import { BigNumber } from 'ethers'
import { Execute } from '@chainlink/types'
import { GetBalanceImpl } from './index'

export const NAME = 'BTCD'

interface Transaction {
  vin: {
    coinbase?: string
    prevOut?: {
      addresses: string[]
      value: number
    }
  }[]
  vout: {
    value: number
    scriptPubKey: {
      addresses: string[]
    }
  }[]
  confirmations: number
}

export const makeAddressBalanceCall: GetBalanceImpl = (adapter) => {
  return async (account, config) => {
    const confirmations = config.confirmations || 6
    const txs = (await searchRawTxs(adapter, account.address)).filter(
      (tx) => tx.confirmations >= confirmations,
    )
    const txsOut = txs
      .filter((tx) =>
        tx.vin.filter((vin) => vin.prevOut && vin.prevOut.addresses.indexOf(account.address) >= 0),
      )
      .map((tx) => tx.vin.map((vin) => BigNumber.from(vin.prevOut?.value)))
      .flat() as BigNumber[]

    const txsIn = txs
      .filter((tx) =>
        tx.vout.filter((vout) => vout.scriptPubKey.addresses.indexOf(account.address) >= 0),
      )
      .map((tx) => tx.vout.map((vout) => BigNumber.from(vout.value)))
      .flat() as BigNumber[]

    const totalOut = txsOut.reduce((sum, out) => sum.add(out), BigNumber.from(0))
    const totalIn = txsIn.reduce((sum, inn) => sum.add(inn), BigNumber.from(0))
    const balance = totalIn.sub(totalOut).toString()

    return {
      result: [
        {
          ...account,
          balance,
        },
      ],
      payload: [txs],
    }
  }
}

const searchRawTxs = async (adapter: Execute, address: string): Promise<Transaction[]> => {
  const allTxs = []
  let skip = 0
  const count = 100
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const txs = await queryRawTx(adapter, address, skip, count)
    allTxs.push(...txs)
    if (txs.length < count) break
    skip += txs.length
  }
  return allTxs
}

const queryRawTx = async (
  adapter: Execute,
  address: string,
  skip: number,
  count: number,
): Promise<Transaction[]> => {
  const request = {
    id: '1',
    data: {
      method: 'searchrawtransactions',
      params: {
        address,
        skip,
        count,
      },
    },
  }
  const response = await adapter(request)
  return response.data.result
}
