import { ethers } from 'ethers'
import { AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'

interface PorInputAddress {
  network: string
  chainId: string
  address: string
}

export const fetchAddressList = async (
  addressManager: ethers.Contract,
  latestBlockNum: number,
  network: string,
  chainId: string,
  confirmations = 0,
): Promise<PorInputAddress[]> => {
  try {
    const blockTag = latestBlockNum - confirmations
    const numAddresses = await addressManager.validatorsLength({
      blockTag,
    })
    const fetchAddresses = async (index: number) => addressManager.validators(index, { blockTag })
    const response = await Promise.all(
      new Array(numAddresses.toNumber()).fill(0).map((_, i) => fetchAddresses(i)),
    )
    return response.map((address) => ({
      address,
      network,
      chainId,
    }))
  } catch (e: any) {
    throw new AdapterDataProviderError({
      network,
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
