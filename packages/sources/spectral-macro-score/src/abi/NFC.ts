import { BigNumber, ethers } from 'ethers'
import NFCAbi from './NFC.json'

const getTickSet = async (
  nfc: NFC,
  tickSetId: BigNumber,
): Promise<BigNumber[]> => {
  const tickset: BigNumber[] = await nfc.getTickSet(tickSetId)
  return tickset.map((tick) => BigNumber.from(tick))
}

interface NFC {
  getTickSet(tickSetId: BigNumber): Promise<BigNumber[]>
}

const makeNFC = async (address: string, rpcUrl: string): Promise<NFC> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const nfc = new ethers.Contract(address, (<ethers.ContractInterface><unknown>NFCAbi), provider)
  return {
    getTickSet: (tickSetId: BigNumber) => getTickSet(<NFC><unknown>nfc, tickSetId),
  }
}

export default makeNFC
