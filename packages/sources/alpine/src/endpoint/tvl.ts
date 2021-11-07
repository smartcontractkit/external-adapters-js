import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import * as fs from 'fs'
import path from 'path'

/**
 * This endpoint gets us the TVL of a vault on ethereum.
 */

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['tvl']

export const inputParameters: InputParameters = {
  chainId: true,
  vaultAddress: true,
}

interface chainIdMap {
  [chainId: number]: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  /**
   * Testing with 
   * curl -d '{"id": 0, "data": {"chainId": 42, "vaultAddress": "0xA0F3BC193651c902C0cae9779c6E7F10761bF2Ac", "endpoint": "tvl"}}'\
            -H "Content-Type: application/json" -X POST http://localhost:8080/
   */
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { chainId, vaultAddress } = validator.validated.data

  // eth mainnet, eth kovan, polygon mainnet, polygon mumbai
  if (![1, 42].includes(chainId))
    throw new AdapterError({
      jobRunID,
      statusCode: 400,
      message: `Chain with id ${chainId} not supported`,
    })

  const chainIdToName: chainIdMap = {
    1: 'eth-mainnet.alchemyapi.io',
    42: 'eth-kovan.alchemyapi.io',
  }
  const name = chainIdToName[chainId]

  const provider = new ethers.providers.JsonRpcProvider(`https://${name}/v2/${config.apiKey}`)
  const abi = fs.readFileSync(path.resolve(__dirname, '../../src/abi/vault.json'), 'utf8')

  const vault = new ethers.Contract(vaultAddress, abi, provider)
  const result = (await vault.totalAssets()).toString()

  console.log({ result })

  return {
    jobRunID,
    result,
    data: { result },
    statusCode: 200,
  }
}
