import JSONRPC from '@chainlink/json-rpc-adapter'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { DEFAULT_RPC_URL, Config } from '../config'
import { ethers } from 'ethers'

export const NAME = 'format'

export const inputParams = {
    url: false,
    chainId: true,
    blockNumber: true
}


export const execute = async (request: AdapterRequest, config: Config): Promise<AdapterResponse> => {
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
    })
    const coder = new ethers.utils.AbiCoder()
    response.data.result = coder.encode(
      ['uint8', 'bytes32', 'bytes32'],
      [chainId, response.data.result.hash, response.data.result.receiptsRoot]
    )
    response.data.result = response.data.result.slice(2)
    return Requester.success(jobRunID, response)
  }
