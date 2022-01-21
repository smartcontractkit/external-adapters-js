import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config, DEFAULT_NETWORK, ETH } from '../config'
import vaultAbi from '../abi/vault.json'
import { ethers } from 'ethers'
/**
 * This endpoint gets us the TVL of a vault on ethereum.
 */
export const supportedEndpoints = ['tvl']

export const inputParameters: InputParameters = {
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
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { network, vaultAddress } = validator.validated.data

  const rpcUrl = network.toUpperCase() == ETH ? config.ethereumRpcUrl : config.polygonRpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

  const vault = new ethers.Contract(vaultAddress, vaultAbi, provider)
  const result = (await vault.totalAssets()).toString()

  return {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }
}
