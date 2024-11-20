import * as reduce from '@chainlink/reduce-adapter'
import { AdapterContext, AdapterResponse } from '@chainlink/ea-bootstrap'
import { callAdapter } from '.'
import * as bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import { adapter as bitcoinPorIndexer } from '@chainlink/por-indexer-adapter'
import * as adaBalance from '@chainlink/ada-balance-adapter'
import { adapter as lotus } from '@chainlink/lotus-adapter'
import { adapter as tokenBalance } from '@chainlink/token-balance-adapter'
import { ethers } from 'ethers'

const returnParsedUnits = (
  jobRunID: string,
  result: string,
  units: number,
  skipConvert = false,
) => {
  const convertedResult =
    skipConvert || units === 0 ? result : ethers.utils.parseUnits(result, units).toString()
  return {
    jobRunID,
    result: convertedResult,
    statusCode: 200,
    data: {
      result: convertedResult,
      statusCode: 200,
      decimals: units,
    },
  }
}

// Get reduce balances as total balance
export const runReduceAdapter = async (
  indexer: string,
  context: AdapterContext,
  input: AdapterResponse,
): Promise<AdapterResponse> => {
  // Some adapters' balances come already reduced
  // but needs to be converted from their base unit
  switch (indexer) {
    case bitcoinJsonRpc.NAME:
    case bitcoinPorIndexer.name:
      return returnParsedUnits(input.jobRunID, input.data.result as string, 8)
    case tokenBalance.name:
      return returnParsedUnits(input.jobRunID, input.data.result as string, 18, true)
    case lotus.name:
    case adaBalance.NAME:
      // TODO: type makeExecute response
      return returnParsedUnits(input.jobRunID, input.data.result as string, 0)
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
  // TODO: type makeExecute return
  return callAdapter(reduce.makeExecute() as any, context, next, '_onReduce')
}
