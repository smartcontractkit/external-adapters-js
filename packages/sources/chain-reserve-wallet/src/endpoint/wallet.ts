import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterResponse, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'

export const supportedEndpoints = ['wallet']

export interface ResponseSchema {
  data: {
    addresses: string[]
  }
}

export const inputParameters: InputParameters = {
  chainID: true,
  contractAddress: true,
}

const abi = [
  {
    inputs: [
      {
        internalType: 'enum AddressManager.Network',
        name: 'network',
        type: 'uint8',
      },
    ],
    name: 'walletAddresses',
    outputs: [
      {
        internalType: 'string[]',
        name: '',
        type: 'string[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { chainID, contractAddress } = validator.validated.data
  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const walletProviderContract = new ethers.Contract(contractAddress, abi, provider)
  const addresses = await walletProviderContract.walletAddresses(chainID)

  const result: AdapterResponse = {
    jobRunID,
    result: addresses,
    data: {
      result: addresses,
    },
    statusCode: 200,
  }

  return Requester.success(jobRunID, result, config.verbose)
}
