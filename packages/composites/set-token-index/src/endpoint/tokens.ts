import { ethers, utils } from 'ethers'
import {
  Logger,
  Requester,
  Validator,
  AdapterDataProviderError,
  util,
} from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'

export const supportedEndpoints = ['tokens']

type Directory = Record<string, { symbol: string; decimals: number }>

const getDirectory = async (network: string): Promise<Directory> => {
  return await import(`./directory.${network}.json`)
}

const ERC20ABI = [
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const ERC20ABI_bytes32 = [
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'bytes32',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const getOnChainErc20Token = async (
  rpcUrl: string,
  address: string,
): Promise<{ symbol: string; decimals: number }> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const _symbol = (abi: ethers.ContractInterface) =>
    new ethers.Contract(address, abi, provider).symbol()
  const decimals = await new ethers.Contract(address, ERC20ABI, provider).decimals()
  Logger.debug(`Fetching ERC20 token details from blockchain on address ${address}`)
  return { symbol: await getOnChainSymbol(_symbol), decimals }
}

const getOnChainSymbol = async (
  _symbol: (abi: ethers.ContractInterface) => Promise<string>,
): Promise<string> => {
  try {
    return await _symbol(ERC20ABI)
  } catch (ignoreable) {
    // TODO: is this error really ignoreable in all cases?
    return utils.parseBytes32String(await _symbol(ERC20ABI_bytes32))
  }
}

let cachedDirectory: Directory

export const getToken = async (
  address: string,
  rpcUrl: string,
  network: string,
): Promise<{ symbol: string; decimals: number }> => {
  if (!cachedDirectory) {
    cachedDirectory = await getDirectory(network)
  }
  return cachedDirectory[address] || (await getOnChainErc20Token(rpcUrl, address))
}

export type TInputParameters = {
  address: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  address: {
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address

  try {
    if (!cachedDirectory) {
      cachedDirectory = await getDirectory(config.network)
    }
    const token = cachedDirectory[address] || (await getOnChainErc20Token(config.rpcUrl, address))

    const response = {
      data: token,
    }

    return Requester.success(jobRunID, response, true)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: config.network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
