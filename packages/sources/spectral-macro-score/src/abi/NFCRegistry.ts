import { ethers } from 'ethers'
import NFCRegistryAbi from './NFCRegistryABI'

const getNFCAddressFunction = async (nfcRegistry: NFCRegistry): Promise<string> => {
  const nfcAddress = await nfcRegistry.getNFC()
  return nfcAddress
}

interface NFCRegistry {
  getNFC(): Promise<string>
}

const makeNFCRegistry = async (address: string, rpcUrl: string): Promise<NFCRegistry> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const nfcRegistry = new ethers.Contract(
    address,
    <ethers.ContractInterface>NFCRegistryAbi.abi,
    provider,
  )
  return {
    getNFC: () => getNFCAddressFunction(<NFCRegistry>(<unknown>nfcRegistry)),
  }
}

export const getNFCAddress = async (
  nfcRegistryAddress: string,
  rpcUrl: string,
): Promise<string> => {
  const nfcRegistry = await makeNFCRegistry(nfcRegistryAddress, rpcUrl)
  return await nfcRegistry.getNFC()
}
