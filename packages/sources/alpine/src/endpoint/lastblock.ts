import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, DEFAULT_NETWORK, ETH } from '../config'
import stagingAbi from '../abi/stagingContract.json'
import { ethers } from 'ethers'

export const supportedEndpoints = ['lastblock']

export const inputParameters: InputParameters = {
  stagingAddress: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { stagingAddress } = validator.validated.data

  const network = validator.validated.data.network || DEFAULT_NETWORK
  const rpcUrl = network.toUpperCase() == ETH ? config.ethereumRpcUrl : config.polygonRpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

  const stagingContract = new ethers.Contract(stagingAddress, stagingAbi, provider)
  const result = (await stagingContract.lastBlock()).toString()

  return {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }
}
