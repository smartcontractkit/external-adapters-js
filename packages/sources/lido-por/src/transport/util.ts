import { BigNumber, ethers } from 'ethers'
import Lido from '../abi/Lido.json'

export type EthereumClResponse = {
  withdrawalCredential: string
  totalBeaconBalance: string
  totalLimboBalance: string
  totalBalance: string
}[]

export const parseBeaconBalance = (
  data: EthereumClResponse,
  withdrawalCredential: string,
): BigNumber => {
  return data
    .filter((e) => e.withdrawalCredential == withdrawalCredential)
    .map((e) => BigNumber.from(e.totalBalance))
    .reduce((sum, e) => sum.add(e))
}

export const getBufferedEther = async (
  bufferContract: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<BigNumber> => {
  const contract = new ethers.Contract(bufferContract, Lido, provider)

  return BigNumber.from((await contract.getBufferedEther()).toString())
}
