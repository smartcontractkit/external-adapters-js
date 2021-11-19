import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import vaultAbi from '../abi/vault.json'

/**
 * This endpoint gets us the TVL of a vault on ethereum.
 */
export const supportedEndpoints = ['tvl']

export const inputParameters: InputParameters = {
  vaultAddress: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { vaultAddress } = validator.validated.data

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)

  const vault = new ethers.Contract(vaultAddress, vaultAbi, provider)
  const result = (await vault.totalAssets()).toString()

  return {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }
}
