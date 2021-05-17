import { ethers, utils } from 'ethers'
import { Logger } from '@chainlink/ea-bootstrap'

type Directory = Record<string, string>

const getDirectory = async (network: string): Promise<Directory> => {
  const directory = await import(`./directory.${network}.json`)
  return directory
}

const ERC20ABI = ['function symbol() view returns (string)']
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

const getERC20Symbol = async (rpcUrl: string, address: string): Promise<string> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const _symbol = (abi: any) => new ethers.Contract(address, abi, provider).symbol()
  Logger.debug('Calling blockchain to get ERC20 token symbol...')
  try {
    return await _symbol(ERC20ABI)
  } catch (ignoreable) {
    // TODO: is this error really ignoreable in all cases?
    return utils.parseBytes32String(await _symbol(ERC20ABI_bytes32))
  }
}

let cachedDirectory: Directory

export const getSymbol = async (
  address: string,
  rpcUrl: string,
  network: string,
): Promise<string> => {
  if (!cachedDirectory) {
    cachedDirectory = await getDirectory(network)
  }
  return cachedDirectory[address] || (await getERC20Symbol(rpcUrl, address))
}
