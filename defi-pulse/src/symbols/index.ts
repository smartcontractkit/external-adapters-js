import fs from 'fs'
import { join } from 'path'
import { ethers, utils } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

const directoryPath = './src/symbols/directory.json'
const rpcUrl = util.getRequiredEnv('RPC_URL')
const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

type Directory = Record<string, string>

const getDirectory = (): Directory => {
  const absolutePath = join(process.cwd(), directoryPath)
  const buffer = fs.readFileSync(absolutePath, 'utf8')
  return JSON.parse(buffer.toString())
}

const updateDirectory = (address: string, symbol: string): void => {
  const absolutePath = join(process.cwd(), directoryPath)
  const directory = cachedDirectory().directory
  directory[address] = symbol
  fs.writeFileSync(absolutePath, JSON.stringify(directory))
  cachedDirectory().update()
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

const getERC20Symbol = async (
  provider: ethers.providers.Provider,
  address: string,
): Promise<string> => {
  const _symbol = (abi: any) => new ethers.Contract(address, abi, provider).symbol()
  console.log('Calling blockchain to get ERC20 token symbol...')
  try {
    return await _symbol(ERC20ABI)
  } catch (ignoreable) {
    // TODO: is this error really ignoreable in all cases?
    return utils.parseBytes32String(await _symbol(ERC20ABI_bytes32))
  }
}

function memoizeDirectory() {
  let directory = getDirectory()
  return () => {
    return { directory, update: (): Directory => (directory = getDirectory()) }
  }
}

const cachedDirectory = memoizeDirectory()

export const getSymbol = async (address: string): Promise<string> => {
  try {
    const directory = cachedDirectory().directory
    if (!directory[address]) {
      const symbol = await getERC20Symbol(provider, address)
      updateDirectory(address, symbol)
      return symbol
    }
    return directory[address]
  } catch (e) {
    console.log(e)
    throw e
  }
}
