import { AdapterDataProviderError, util, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config, DEFAULT_NETWORK, ETH } from '../config'
import stagingAbi from '../abi/stagingContract.json'
import { ethers } from 'ethers'

export const supportedEndpoints = ['lastblock']

export const description = 'This gets the lastblock of a cross chain transfer from the given chain.'

export type TInputParameters = { stagingAddress: string; network: string }

export const inputParameters: InputParameters<TInputParameters> = {
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

  const jobRunID = validator.validated.id
  const { network, stagingAddress } = validator.validated.data

  const rpcUrl = network.toUpperCase() == ETH ? config.ethereumRpcUrl : config.polygonRpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

  const stagingContract = new ethers.Contract(stagingAddress, stagingAbi, provider)
  let result
  try {
    result = (await stagingContract.lastBlock()).toString()
  } catch (e) {
    throw new AdapterDataProviderError({
      network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const endpointResponse = {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }

  return Requester.success(jobRunID, endpointResponse, config.verbose)
}
