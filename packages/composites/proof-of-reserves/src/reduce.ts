import reduce from '@chainlink/reduce-adapter'
import { AdapterResponse } from '@chainlink/types'
import { callAdapter } from './adapter'
import { Indexer } from './balance'
import bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import { ethers } from 'ethers'

// Get reduce balances as total balance
export const runReduceAdapter = async (
  indexer: Indexer,
  input: AdapterResponse,
): Promise<AdapterResponse> => {
  // Bitcoin JSON RPC data balances come already reduced
  // but needs to be converted to satoshis
  if (indexer === bitcoinJsonRpc.NAME) {
    const convertedResult = ethers.utils.parseUnits(input.data.result, 8).toString()
    return {
      jobRunID: input.jobRunID,
      result: convertedResult,
      statusCode: 200,
      data: {
        result: convertedResult,
      },
    }
  }

  const next = {
    id: input.jobRunID,
    data: {
      result: input.data.result,
      reducer: 'sum',
      initialValue: 0,
      dataPath: 'result',
      valuePath: 'balance',
    },
  }
  return callAdapter(reduce.execute, next, '_onReduce')
}
