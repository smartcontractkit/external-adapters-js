import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, DEFAULT_NETWORK, ETH } from '../config'
import stagingAbi from '../abi/stagingContract.json'
import { ethers } from 'ethers'

export const supportedEndpoints = ['lastblock']

export const inputParameters: InputParameters = {
  stagingAddress: {
    required: true,
    description: 'The address of the staging contract',
    type: 'string',
  },
  network: {
    required: false,
    description: 'The network',
    default: DEFAULT_NETWORK,
    type: 'string',
    options: ['ETHEREUM', 'POLYGON'],
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { network, stagingAddress } = validator.validated.data

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
