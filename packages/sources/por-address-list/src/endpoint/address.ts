import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import { POR_ADDRESS_LIST_ABI } from './abi'
import { fetchAddressList } from './utils'

export const supportedEndpoints = ['address']

export const description =
  'This EA fetches the list of custodial addresses that hold the funds for a PoR feed'

export const inputParameters: InputParameters = {
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
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const { confirmations, contractAddress, batchSize } = validator.validated.data
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const addressManager = new ethers.Contract(contractAddress, POR_ADDRESS_LIST_ABI, provider)
  const latestBlockNum = await provider.getBlockNumber()
  const addressList = await fetchAddressList(
    addressManager,
    latestBlockNum,
    confirmations,
    batchSize,
  )
  return {
    jobRunID,
    result: addressList,
    data: {
      result: addressList,
    },
    statusCode: 200,
  }
}
