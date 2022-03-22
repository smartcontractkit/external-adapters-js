import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterResponse, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'

export const supportedEndpoints = ['wallet']

export interface ResponseSchema {
  data: {
    addresses: string[]
  }
}

export const description =
  'This endpoint returns a list of custodial chain addresses from an Ethereum smart contract.'

export const inputParameters: InputParameters = {
  network: {
    description: 'The name of the target custodial chain.',
    type: 'string',
    default: 'Bitcoin',
  },
  contractAddress: {
    description: 'The address of the Address Manager contract holding the custodial addresses.',
    type: 'string',
    required: true,
  },
}

const ADDRESS_MANAGER_ABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'network',
        type: 'string',
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

  const jobRunID = validator.validated.id
  const { contractAddress, network } = validator.validated.data

  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const walletProviderContract = new ethers.Contract(contractAddress, ADDRESS_MANAGER_ABI, provider)
  const addresses: string[] = await walletProviderContract.walletAddresses(network)

  const response = addresses.map((address) => ({ address, network }))
  const result: AdapterResponse = {
    jobRunID,
    result: response,
    data: {
      result: response,
    },
    statusCode: 200,
  }

  return Requester.success(jobRunID, result, config.verbose)
}
