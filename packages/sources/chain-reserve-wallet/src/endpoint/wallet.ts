import { AdapterInputError, Requester, Validator, AdapterDataProviderError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

const networks = ['cardano', 'dogecoin']
const chainIds = ['mainnet', 'testnet']

const networkChainMap: { [key: string]: number } = {
  cardano_testnet: 0,
  dogecoin_testnet: 1,
  cardano_mainnet: 2,
  dogecoin_mainnet: 3,
}

const isNetwork = (maybeNetwork: string) => networks.indexOf(maybeNetwork) !== -1
const isChainId = (maybeChainId: string) => chainIds.indexOf(maybeChainId) !== -1

export const supportedEndpoints = ['wallet']

export interface ResponseSchema {
  data: {
    addresses: string[]
  }
}

export const description =
  'This endpoint reads the set of custodial addresses from a smart contract and returns in as a response.'

export type TInputParameters = { chainId: string; contractAddress: string; network: string }
export const inputParameters: InputParameters<TInputParameters> = {
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
    required: true,
  },
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

  const jobRunID = validator.validated.id
  const { chainId, contractAddress, network } = validator.validated.data

  if (!isNetwork(network)) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Unknown network: ${network}`,
    })
  }

  if (!isChainId(chainId)) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `Unknown chainId: ${chainId}`,
    })
  }

  const chain = networkChainMap[`${network}_${chainId}`]

  const rpcUrl = config.rpcUrl
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const walletProviderContract = new ethers.Contract(contractAddress, abi, provider)
  let addresses: string[]
  try {
    addresses = await walletProviderContract.walletAddresses(chain)
  } catch (e) {
    throw new AdapterDataProviderError({
      network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const response = addresses.map((address) => ({ address, chainId, network }))
  const result = {
    jobRunID,
    result: response,
    data: {
      result: response,
    },
    statusCode: 200,
  }

  return Requester.success(jobRunID, result, config.verbose)
}
