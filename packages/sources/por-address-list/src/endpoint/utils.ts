import { ethers } from 'ethers'

export const fetchAddressList = async (
  addressManager: ethers.Contract,
  confirmations = 0,
  batchSize = 10,
): Promise<string[]> => {
  const blockTag = confirmations ? -confirmations : undefined
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
  // Filter out duplicate addresses
  return [...new Set(addresses)]
}
