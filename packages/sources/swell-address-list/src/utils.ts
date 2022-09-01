import { ethers } from 'ethers'
import { AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'

export const fetchAddressList = async (
  addressManager: ethers.Contract,
  multicall: ethers.Contract,
  latestBlockNum: number,
  network: string,
  chainId: string,
  confirmations = 0,
): Promise<string[]> => {
  try {
    const blockTag = latestBlockNum - confirmations
    const numAddresses = await addressManager.validatorsLength({
      blockTag,
    })
    const callData = [...Array(numAddresses.toNumber())].map((_, index) => {
      const fragment = addressManager.interface.getFunction('validators')
      const encodedCallData = addressManager.interface.encodeFunctionData(fragment, [index])
      return {
        target: addressManager.address,
        callData: encodedCallData,
      }
    })
    const response = await multicall.aggregate(callData)
    return response.returnData.map((data: string) => {
      const fragment = addressManager.interface.getFunction('validators')
      const [address] = addressManager.interface.decodeFunctionResult(fragment, data)
      return { address, network, chainId }
    })
  } catch (e: any) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
