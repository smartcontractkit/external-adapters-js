import { ethers } from 'ethers'
import { AdapterDataProviderError, util } from '../../../../core/bootstrap'

export const fetchAddressList = async (
  addressManager: ethers.Contract,
  latestBlockNum: number,
  confirmations = 0,
  batchSize = 10,
): Promise<string[]> => {
  try {
    const blockTag = latestBlockNum - confirmations
    const numAddresses = await addressManager.getPoRAddressListLength({
      blockTag,
    })
    let addresses: string[] = []
    let startIdx = ethers.BigNumber.from(0)
    while (ethers.BigNumber.from(addresses.length).lt(numAddresses)) {
      const nextEndIdx = startIdx.add(batchSize)
      const endIdx = nextEndIdx.gt(numAddresses) ? numAddresses.sub(1) : nextEndIdx
      // element at endIdx is included in result
      const latestAddresses = await addressManager.getPoRAddressList(startIdx, endIdx, {
        blockTag,
      })
      addresses = addresses.concat(latestAddresses)
      startIdx = endIdx.add(1)
    }
    return addresses
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
