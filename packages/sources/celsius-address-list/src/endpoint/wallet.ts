import {
  AxiosResponse,
  Config,
  ExecuteWithConfig,
  InputParameters,
  Requester,
  Validator,
  AdapterDataProviderError,
  util
} from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

const networks = ['bitcoin']
const chainIds = ['mainnet']

type NetworkChainMap = { [network: string]: { [chain: string]: string } }

const networkChainMap: NetworkChainMap = { bitcoin: { mainnet: 'Bitcoin' } }

export const supportedEndpoints = ['wallet']

export const description =
  'This endpoint returns a list of custodial chain addresses from an Ethereum smart contract.'

export type TInputParameters = { chainId: string; contractAddress: string; network: string }
export const inputParameters: InputParameters<TInputParameters> = {
  chainId: {
    description: 'The name of the target custodial chain',
    options: chainIds,
    type: 'string',
    required: true,
  },
  contractAddress: {
    description: 'The address of the Address Manager contract holding the custodial addresses.',
    type: 'string',
    required: true,
  },
  network: {
    description: 'The name of the target custodial network protocol',
    options: networks,
    type: 'string',
    required: true,
  },
}

const ADDRESS_MANAGER_ABI = [
  {
    name: 'walletAddresses',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'network', internalType: 'string', type: 'string' }],
    outputs: [{ name: '', internalType: 'string[]', type: 'string[]' }],
  },
]

export type Address = {
  address: string
  network: string
  chainId: string
}

interface ResponseWithResult extends Partial<AxiosResponse> {
  jobRunID: string
  statusCode: number
  result: Address[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const { chainId, contractAddress, network } = validator.validated.data

  const networkChainId = networkChainMap[network][chainId]

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const walletProviderContract = new ethers.Contract(contractAddress, ADDRESS_MANAGER_ABI, provider)
  let addresses: string[]
  try {
    addresses = await walletProviderContract.walletAddresses(networkChainId)
  } catch (e) {
    throw new AdapterDataProviderError({
      network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const response: Address[] = addresses.map((address) => ({ address, chainId, network }))
  const result: ResponseWithResult = {
    jobRunID,
    result: response,
    data: { result: response },
    statusCode: 200,
  }

  return Requester.success(jobRunID, result, config.verbose)
}
