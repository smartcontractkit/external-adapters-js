import * as JSONRPC from '@chainlink/json-rpc-adapter'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Validator, Requester, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { DEFAULT_RPC_URL, ExtendedConfig } from '../config'
import { ethers } from 'ethers'

export const NAME = 'format'
export const supportedEndpoints = [NAME]

export const description =
  'The format endpoint encodes the chainId, block hash, and block receiptsRoot as bytes and returns that without a 0x prefix.'

export type TInputParameters = { url?: string; chainId?: string; blockNumber: number }

export const inputParameters: InputParameters<TInputParameters> = {
  url: {
    description: 'Blockchain RPC endpoint',
    required: false,
  },
  chainId: {
    description: 'An identifier for which network of the blockchain to use',
    required: false,
  },
  blockNumber: {
    description: 'Block number to query for',
    required: true,
  },
}

type ResponseSchema = {
  difficulty: string
  extraData: string
  gasLimit: string
  gasUsed: string
  hash: string
  logsBloom: string
  miner: string
  mixHash: string
  nonce: string
  number: string
  parentHash: string
  receiptsRoot: string
  sha3Uncles: string
  size: string
  stateRoot: string
  timestamp: string
  totalDifficulty: string
  transactions: string[]
  transactionsRoot: string
  uncles: string[]
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const url = validator.validated.data.url || config.RPC_URL || DEFAULT_RPC_URL
  const provider = new ethers.providers.JsonRpcProvider(url)
  const jobRunID = validator.validated.id

  const chainId = validator.validated.data.chainId
  const blockNumber = validator.validated.data.blockNumber

  try {
    const block = await provider.getBlock(blockNumber)
    const _execute = JSONRPC.makeExecute(config)
    const response = await _execute(
      {
        ...request,
        data: {
          ...(request.data as JSONRPC.types.request.TInputParameters),
          method: 'eth_getBlockByHash',
          params: [block.hash, false] as string[],
        },
      },
      context,
    )
    const coder = new ethers.utils.AbiCoder()
    const responseData = response.data.result as unknown as ResponseSchema
    const encodedResult = coder.encode(
      ['uint8', 'bytes32', 'bytes32'],
      [chainId, responseData.hash, responseData.receiptsRoot],
    )
    const result = encodedResult.slice(2)
    return Requester.success(jobRunID, { data: { responseData, result } }, config.verbose)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
