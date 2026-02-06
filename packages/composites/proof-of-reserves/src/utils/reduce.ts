import { AdapterContext, AdapterError, AdapterResponse } from '@chainlink/ea-bootstrap'
import * as reduce from '@chainlink/reduce-adapter'
import { ethers } from 'ethers'
import { callAdapter } from '.'
import { adapterNamesV2, adapterNamesV3, ETHEREUM_CL_INDEXER } from './balance'

export function parseHexOrDecToBigInt(value: unknown): bigint {
  if (typeof value !== 'string') {
    throw new Error(`Expected a hex or decimal string, but received type: ${typeof value}`)
  }
  if (!/^0x[0-9a-fA-F]+$|^[1-9][0-9]*$|^0$/.test(value)) {
    throw new Error(`Invalid hex or decimal string: ${value}`)
  }
  return BigInt(value)
}

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
  indexerEndpoint?: string,
  viewFunctionIndexerResultDecimals?: number,
): Promise<AdapterResponse> => {
  // Some adapters' balances come already reduced
  // but needs to be converted from their base unit
  switch (indexer) {
    case adapterNamesV2.bitcoinJsonRpc:
    case adapterNamesV3.porIndexer:
      return returnParsedUnits(input.jobRunID, input.data.result as string, 8)
    case adapterNamesV3.tokenBalance:
      // For xrp, solana-balance and stellar, we use the default processing
      // below the switch block.
      if (!['xrp', 'solana-balance', 'stellar'].includes(indexerEndpoint as string)) {
        return returnParsedUnits(input.jobRunID, input.data.result as string, 18, true)
      }
      break
    case adapterNamesV3.ceffu:
      return returnParsedUnits(
        input.jobRunID,
        input.data.result as string,
        18 - (input.data.decimals as number),
        false,
        18,
      )
    case adapterNamesV3.lotus:
    case adapterNamesV2.adaBalance:
      // TODO: type makeExecute response
      return returnParsedUnits(input.jobRunID, input.data.result as string, 0)
    case ETHEREUM_CL_INDEXER:
      if (indexerEndpoint === 'porBalance') {
        const hasInvalidResults = (input.data.result as unknown as Record<string, unknown>[])?.some(
          (result) => result.isValid === false,
        )
        if (hasInvalidResults) {
          throw new AdapterError({
            statusCode: 400,
            message: 'ETHEREUM_CL_INDEXER endpoint porBalance ripcord is true',
          })
        }
        // If all results are valid, use default processing below the
        // switch block.
      } else if (indexerEndpoint === 'etherFiBalance') {
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
      } else {
        throw new AdapterError({
          statusCode: 400,
          message: `ETHEREUM_CL_INDEXER indexerEndpoint is not supported: ${indexerEndpoint}`,
        })
      }
      break
    case adapterNamesV3.viewFunctionMultiChain: {
      let decimalsOffset: number

      const decimalsHex = input.data.decimals
      if (decimalsHex != null) {
        decimalsOffset = 18 - Number(decimalsHex)
      } else if (viewFunctionIndexerResultDecimals != null) {
        decimalsOffset = 18 - Number(viewFunctionIndexerResultDecimals)
      } else {
        throw new Error(
          `Missing decimals: neither input.data.decimals nor viewFunctionIndexerResultDecimals provided`,
        )
      }

      return returnParsedUnits(
        input.jobRunID,
        parseHexOrDecToBigInt(input.data.result).toString(),
        decimalsOffset,
        false,
        18,
      )
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
  // TODO: type makeExecute return
  return callAdapter(reduce.makeExecute() as any, context, next, '_onReduce')
}
