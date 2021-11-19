import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import stagingAbi from '../abi/stagingContract.json'

export const supportedEndpoints = ['lastblock']

export const inputParameters: InputParameters = {
  stagingAddress: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { stagingAddress } = validator.validated.data

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)

  const stagingContract = new ethers.Contract(stagingAddress, stagingAbi, provider)
  const result = (await stagingContract.lastBlock()).toString()

  return {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }
}
