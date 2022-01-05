import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterResponse, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'

const networks = ['cardano', 'doge']
const chainIds = ['mainnet', 'testnet']

const networkChainMap: { [key: string]: number } = {
  cardano_testnet: 0,
  doge_testnet: 1,
  cardano_mainnet: 2,
  doge_mainnet: 3,
}

const isNetwork = (maybeNetwork: string) => networks.indexOf(maybeNetwork) !== -1
const isChainId = (maybeChainId: string) => chainIds.indexOf(maybeChainId) !== -1

export const supportedEndpoints = ['wallet']

export interface ResponseSchema {
  data: {
    addresses: string[]
  }
}

export const inputParameters: InputParameters = {
  chainId: {
    description: 'The ID of the target PoR chain.',
    options: chainIds,
    type: 'string',
    required: true,
  },
  contractAddress: {
    description: 'The address of the smart contract holding the custodial addresses.',
    type: 'string',
    required: true,
  },
  network: {
    description: 'Blockchain network',
    options: networks,
    type: 'string',
    required: true
  }
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
  const { chainId, contractAddress, network } = validator.validated.data

  if (!isNetwork(network)) {
    throw Error(`Unknown network: ${network}`)
  }

  if (!isChainId(chainId)) {
    throw Error(`Unknown chainId: ${chainId}`)
  }

  const chain = networkChainMap[`${network}_${chainId}`]

  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const walletProviderContract = new ethers.Contract(contractAddress, abi, provider)
  const addresses: string[] = await walletProviderContract.walletAddresses(chain)

  const response = addresses.map((address) => ({ address, chainId, network }))
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
