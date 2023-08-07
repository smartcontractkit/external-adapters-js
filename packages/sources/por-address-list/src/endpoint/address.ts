import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { POR_ADDRESS_LIST_ABI } from './abi'
import { fetchAddressList } from './utils'

export const supportedEndpoints = ['address']

export const description =
  'This EA fetches the list of custodial addresses that hold the funds for a PoR feed'

export type TInputParameters = {
  confirmations: number
  contractAddress: string
  batchSize: number
  network: string
  chainId: string
  searchLimboValidators?: boolean
}
export const inputParameters: InputParameters<TInputParameters> = {
  confirmations: {
    description: 'The number of confirmations to query data from',
    default: 0,
  },
  contractAddress: {
    description: 'The contract address holding the custodial addresses',
    required: true,
  },
  batchSize: {
    description: 'The number of addresses to fetch from the contract at a time',
    default: 10,
  },
  network: {
    description: 'The network name to associate with the addresses',
    required: true,
  },
  chainId: {
    description: 'The chain ID to associate with the addresses',
    required: true,
  },
  searchLimboValidators: {
    type: 'boolean',
    description: 'Flag to pass on to the balance adapter to search for limbo validators',
    required: false,
  },
}

interface PorInputAddress {
  network: string
  chainId: string
  address: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const { confirmations, contractAddress, batchSize, network, chainId, searchLimboValidators } =
    validator.validated.data
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl, config.chainId)
  const addressManager = new ethers.Contract(contractAddress, POR_ADDRESS_LIST_ABI, provider)
  const latestBlockNum = await provider.getBlockNumber()
  const addressList = await fetchAddressList(
    addressManager,
    latestBlockNum,
    confirmations,
    batchSize,
  )
  const addresses: PorInputAddress[] = addressList.map((address) => ({ address, network, chainId }))

  const response = {
    jobRunID,
    result: addresses,
    data: {
      searchLimboValidators,
      result: addresses,
    },
    statusCode: 200,
  }
  return Requester.success(jobRunID, response, true)
}
