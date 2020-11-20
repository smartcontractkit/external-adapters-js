import fs from 'fs'
import { join } from 'path'
import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

const directoryPath = './src/symbols/directory.json'

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

const getRpcTokenSymbol = async (address: string): Promise<string> => {
  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const erc20 = new ethers.Contract(address, ERC20ABI, provider)
  return await erc20.symbol()
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
      const symbol = await getRpcTokenSymbol(address)
      updateDirectory(address, symbol)
      return symbol
    }
    return directory[address]
  } catch (e) {
    console.log(e)
    throw e
  }
}
