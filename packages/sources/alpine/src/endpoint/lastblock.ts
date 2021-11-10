import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import * as fs from 'fs'
import path from 'path'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['lastblock']

export const inputParameters: InputParameters = {
  stagingAddress: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  /**
   * Testing with 
   * curl -d '{"id": 0, "data": {"stagingAddress": "0x8635Ec536F0125cf6B766ed67B4A37Dcb76eb508", "endpoint": "lastblock"}}'\
            -H "Content-Type: application/json" -X POST http://localhost:8080/
    * curl -d '{"id": 0, "data": {"stagingAddress": "0xd5c81d46D8237b06fa6110aEB43363b6F63bC247", "endpoint": "lastblock"}}'\
            -H "Content-Type: application/json" -X POST http://localhost:8080/
   */
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { stagingAddress } = validator.validated.data

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const abi = fs.readFileSync(path.resolve(__dirname, '../../src/abi/stagingContract.json'), 'utf8')

  const stagingContract = new ethers.Contract(stagingAddress, abi, provider)
  const result = (await stagingContract.lastBlock()).toString()

  return {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }
}
