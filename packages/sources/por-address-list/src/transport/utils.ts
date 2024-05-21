import { ethers } from 'ethers'

export const fetchAddressList = async (
  addressManager: ethers.Contract,
  latestBlockNum: number,
  confirmations = 0,
  batchSize = 10,
  batchGroupSize = 10,
): Promise<string[]> => {
  const blockTag = latestBlockNum - confirmations
  const numAddresses = await addressManager.getPoRAddressListLength({
    blockTag,
  })
  let totalRequestedAddressesCount = 0
  let startIdx = ethers.BigNumber.from(0)
  const addresses: string[] = []
  let batchRequests: Promise<string[]>[] = []

  while (totalRequestedAddressesCount < numAddresses.toNumber()) {
    const nextEndIdx = startIdx.add(batchSize)
    const endIdx = nextEndIdx.gte(numAddresses) ? numAddresses.sub(1) : nextEndIdx
    const batchCall = addressManager.getPoRAddressList(startIdx, endIdx, { blockTag })
    batchRequests.push(batchCall)
    // element at endIdx is included in result
    const addressesRequested: number = endIdx.sub(startIdx).add(1).toNumber()
    totalRequestedAddressesCount += addressesRequested
    startIdx = endIdx.add(1)

    if (
      batchRequests.length >= batchGroupSize ||
      totalRequestedAddressesCount >= numAddresses.toNumber()
    ) {
      addresses.push(...(await Promise.all(batchRequests)).flat())
      batchRequests = []
    }
  }
  return addresses
}
