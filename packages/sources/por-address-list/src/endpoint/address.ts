import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import { POR_ADDRESS_LIST_ABI } from './abi'

export const supportedEndpoints = ['address']

export const description =
  'This EA fetches the list of custodial addresses that hold the funds for a PoR feed'

// The inputParameters object must be present for README generation.
export const inputParameters: InputParameters = {
  // See InputParameters type for more config options
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
  const addressList = await fetchAddressList(addressManager, confirmations, batchSize)
  return {
    jobRunID,
    result: addressList,
    data: {
      result: addressList,
    },
    statusCode: 200,
  }
}

const fetchAddressList = async (
  addressManager: ethers.Contract,
  confirmations: number,
  batchSize: number,
): Promise<string[]> => {
  const blockTag = confirmations ? -confirmations : undefined
  const numAddresses = await addressManager.getPoRAddressListLength({
    blockTag,
  })
  let addresses: string[] = []
  while (ethers.BigNumber.from(addresses.length).lt(numAddresses)) {
    const startIdx = addresses.length
    const nextEndIdx = ethers.BigNumber.from(startIdx + batchSize)
    const endIdx = nextEndIdx.gt(numAddresses) ? numAddresses : nextEndIdx

    // element at endIdx is included in result
    const latestAddresses = await addressManager.getPoRAddressList(startIdx, endIdx, {
      blockTag,
    })
    addresses = addresses.concat(latestAddresses)
  }
  // Filter out duplicate addresses
  return [...new Set(addresses)]
}
