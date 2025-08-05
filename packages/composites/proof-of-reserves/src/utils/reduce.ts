import * as adaBalance from '@chainlink/ada-balance-adapter'
import * as bitcoinJsonRpc from '@chainlink/bitcoin-json-rpc-adapter'
import { adapter as ceffu } from '@chainlink/ceffu-adapter'
import { AdapterContext, AdapterError, AdapterResponse } from '@chainlink/ea-bootstrap'
import { adapter as lotus } from '@chainlink/lotus-adapter'
import { adapter as bitcoinPorIndexer } from '@chainlink/por-indexer-adapter'
import * as reduce from '@chainlink/reduce-adapter'
import { adapter as tokenBalance } from '@chainlink/token-balance-adapter'
import { adapter as viewFunctionMultiChain } from '@chainlink/view-function-multi-chain-adapter'
import { ethers } from 'ethers'
import { callAdapter } from '.'
import { ETHEREUM_CL_INDEXER } from './balance'

const returnParsedUnits = (
  jobRunID: string,
  result: string,
  units: number, // How many decimal to scale
  skipConvert = false,
  finalDecimals?: number, // The decimal of the final result
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
      decimals: finalDecimals || units,
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
    case ceffu.name:
      return returnParsedUnits(
        input.jobRunID,
        input.data.result as string,
        18 - (input.data.decimals as number),
        false,
        18,
      )
    case lotus.name:
    case adaBalance.NAME:
      // TODO: type makeExecute response
      return returnParsedUnits(input.jobRunID, input.data.result as string, 0)
    case ETHEREUM_CL_INDEXER:
      if (input.data.isValid) {
        return {
          jobRunID: input.jobRunID,
          result: input.data.totalBalance as string,
          statusCode: 200,
          data: {
            result: input.data.totalBalance as string,
            statusCode: 200,
          },
        }
      } else {
        throw new AdapterError({
          statusCode: 400,
          message: `ETHEREUM_CL_INDEXER ripcord is true: ${JSON.stringify(input.data)}`,
        })
      }
    case viewFunctionMultiChain.name:
      return returnParsedUnits(
        input.jobRunID,
        input.data.result as string,
        18 - (input.data.decimals as number),
        false,
        18,
      )
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
