import { ethers, utils } from 'ethers'
import { Logger } from '@chainlink/ea-bootstrap'

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
  const decimals = await new ethers.Contract(address, ERC20ABI, provider).symbol()
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
