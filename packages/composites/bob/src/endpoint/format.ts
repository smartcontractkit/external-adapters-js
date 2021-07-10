import JSONRPC from '@chainlink/json-rpc-adapter'
import { ExecuteWithConfig } from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { DEFAULT_RPC_URL, ExtendedConfig } from '../config'
import { ethers } from 'ethers'

export const NAME = 'format'

export const inputParams = {
    url: false,
    chainId: true,
    blockNumber: true
}

interface ResponseSchema {
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

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, config) => {
    const validator = new Validator(request, inputParams)
    if (validator.error) throw validator.error
    const url = config.RPC_URL || validator.validated.data.url || DEFAULT_RPC_URL
    const provider = new ethers.providers.JsonRpcProvider(url)
    const jobRunID = validator.validated.id

    const chainId = validator.validated.data.chainId
    const blockNumber = validator.validated.data.blockNumber

    const block = await provider.getBlock(blockNumber)

    const response = await JSONRPC.execute({
      ...request,
      data: { ...request.data, method: 'eth_getBlockByHash', params: [block.hash, false] },
    }, config)
    const coder = new ethers.utils.AbiCoder()
    response.data.result = coder.encode(
      ['uint8', 'bytes32', 'bytes32'],
      [chainId, response.data.result.hash, response.data.result.receiptsRoot]
    )
    response.data = response.data as ResponseSchema
    response.data.result = response.data.result.slice(2)
    return Requester.success(jobRunID, response)
  }
