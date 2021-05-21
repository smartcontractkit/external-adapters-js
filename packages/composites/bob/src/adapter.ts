import JSONRPC from '@chainlink/json-rpc-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory, AdapterRequest } from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { DEFAULT_ENDPOINT, makeConfig } from './config'

const { ethers } = require('ethers')

const inputParams = {
  url: false,
  chainId: true,
  blockNumber: true
}

const convertEndpoint: { [key: string]: string } = {
  height: 'headers',
}

// Export function to integrate with Chainlink node
const execute: ExecuteWithConfig<Config> = async (request: AdapterRequest) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const url = process.env.RPC_URL || validator.validated.data.url || 'http://localhost:8545'
  const provider = new ethers.providers.JsonRpcProvider(url)
  const jobRunID = validator.validated.id
  
  const chainId = validator.validated.data.chainId
  const blockNumber = validator.validated.data.blockNumber

  const data = {
    id: jobRunID,
    jsonrpc: '2.0',
    method: 'eth_getBlockByHash'
  }

  const block = await provider.getBlock(blockNumber)

  let response = await JSONRPC.execute({
    ...request,
    data: { ...request.data, method: 'eth_getBlockByHash', params: [block.hash, false] },
  })
  const coder = new ethers.utils.AbiCoder()
  response.data.result = coder.encode(
    ['uint8', 'bytes32', 'bytes32'],
    [chainId, response.data.result.hash, response.data.result.receiptsRoot]
  )
  response.data.result = response.data.result.slice(2)
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
