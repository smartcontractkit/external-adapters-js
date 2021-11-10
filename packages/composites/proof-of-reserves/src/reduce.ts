import reduce from '@chainlink/reduce-adapter'
import { AdapterContext, AdapterResponse } from '@chainlink/types'
import { callAdapter } from './adapter'
import { Indexer } from './balance'
import bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import * as adaBalance from '@chainlink/ada-balance-adapter'
import * as lotus from '@chainlink/lotus-adapter'
import { ethers } from 'ethers'

const returnParsedUnits = (jobRunID: string, result: string, units: number) => {
  const convertedResult = units === 0 ? result : ethers.utils.parseUnits(result, units).toString()
  return {
    jobRunID,
    result: convertedResult,
    statusCode: 200,
    data: {
      result: convertedResult,
    },
  }
}

// Get reduce balances as total balance
export const runReduceAdapter = async (
  indexer: Indexer,
  context: AdapterContext,
  input: AdapterResponse,
): Promise<AdapterResponse> => {
  // Some adapters' balances come already reduced
  // but needs to be converted from their base unit
  switch (indexer) {
    case bitcoinJsonRpc.NAME:
      return returnParsedUnits(input.jobRunID, input.data.result, 8)
    case lotus.NAME:
    case adaBalance.NAME:
      return returnParsedUnits(input.jobRunID, input.data.result, 0)
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
  return callAdapter(reduce.execute, context, next, '_onReduce')
}
