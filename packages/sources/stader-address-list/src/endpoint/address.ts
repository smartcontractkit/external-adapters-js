import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { StaderSSVManager_ABI } from '../abi/StaderSSVManager'
import { fetchAddressList } from '../utils'

const networks = ['ethereum']
const chainIds = ['mainnet', 'goerli']

type NetworkChainMap = { [network: string]: { [chain: string]: string } }

const staderNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: '',
    goerli: '0x00eA010E050Ba28976059241B2cF558b96D1d2B7',
  },
}

export const supportedEndpoints = ['address']

export const description =
  'This EA fetches the list of custodial addresses that hold the funds for a PoR feed'

export type TInputParameters = {
  contractAddress: string
  confirmations?: number
  chainId: string
  network: string
  includedRegistrationStatus?: boolean
  validatorStatus: string[]
}

export const inputParameters: InputParameters<TInputParameters> = {
  contractAddress: {
    description: 'The address of the Address Manager contract holding the custodial addresses.',
    type: 'string',
  },
  confirmations: {
    description: 'The number of confirmations to query data from',
    default: 0,
  },
  chainId: {
    description: 'The name of the target custodial chain',
    options: chainIds,
    type: 'string',
    default: 'mainnet',
  },
  network: {
    description: 'The name of the target custodial network protocol',
    options: networks,
    type: 'string',
    default: 'ethereum',
  },
  includedRegistrationStatus: {
    description: 'The registration status of the validator to filter the validator list by',
    type: 'boolean',
    default: true,
  },
  validatorStatus: {
    required: false,
    type: 'array',
    description: 'A filter to apply validators by their status',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const {
    confirmations,
    contractAddress: contractAddressOverride,
    chainId,
    network,
    includedRegistrationStatus,
    validatorStatus,
  } = validator.validated.data
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const contractAddress = contractAddressOverride || staderNetworkChainMap[network][chainId]
  const addressManager = new ethers.Contract(contractAddress, StaderSSVManager_ABI, provider)
  const latestBlockNum = await provider.getBlockNumber()
  const addressList = await fetchAddressList(
    addressManager,
    latestBlockNum,
    network,
    chainId,
    confirmations,
  )
  const filteredAddressList = addressList.filter(
    ({ registrationStatus }) => registrationStatus === includedRegistrationStatus,
  )

  const result = {
    data: {
      validatorStatus,
      result: filteredAddressList,
    },
    statusCode: 200,
  }

  return Requester.success(jobRunID, result, true)
}
