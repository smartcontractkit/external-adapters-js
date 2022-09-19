import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config, DEFAULT_NETWORK, ETH } from '../config'
import vaultAbi from '../abi/vault.json'
import { ethers } from 'ethers'
/**
 * This endpoint gets us the TVL of a vault on ethereum.
 */
export const supportedEndpoints = ['tvl']

export const description = 'This gets the tvl of a vault on Ethereum.'

export type TInputParameters = { vaultAddress: string; network: string }

export const inputParameters: InputParameters<TInputParameters> = {
  vaultAddress: {
    required: true,
    description: 'The address of the vault contract',
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
  const { network, vaultAddress } = validator.validated.data

  const rpcUrl = network.toUpperCase() == ETH ? config.ethereumRpcUrl : config.polygonRpcUrl
  const chainId = network.toUpperCase() == ETH ? config.ethereumChainId : config.polygonChainId
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)

  const vault = new ethers.Contract(vaultAddress, vaultAbi, provider)
  const result = (await vault.totalAssets()).toString()

  const endpointResponse = {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }

  return Requester.success(jobRunID, endpointResponse, config.verbose)
}
