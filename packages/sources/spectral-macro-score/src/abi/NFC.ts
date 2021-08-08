import { BigNumber, ethers } from 'ethers'
import NFCAbi from './NFCABI'

const getTickSetFunction = async (nfc: NFC, tickSetId: BigNumber): Promise<BigNumber[]> => {
  const tickset: BigNumber[] = await nfc.getTickSet(tickSetId)
  return tickset.map((tick) => BigNumber.from(tick))
}

interface NFC {
  getTickSet(tickSetId: BigNumber): Promise<BigNumber[]>
}

const makeNFC = async (address: string, rpcUrl: string): Promise<NFC> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const nfc = new ethers.Contract(address, <ethers.ContractInterface>NFCAbi.abi, provider)
  return {
    getTickSet: (tickSetId: BigNumber) => getTickSetFunction(<NFC>(<unknown>nfc), tickSetId),
  }
}

export const getTickSet = async (
  nfcAddress: string,
  rpcUrl: string,
  tickSetId: string,
): Promise<BigNumber[]> => {
  const nfc = await makeNFC(nfcAddress, rpcUrl)
  const tickSetIdBigNumber = BigNumber.from(tickSetId)
  return await nfc.getTickSet(tickSetIdBigNumber)
}
