import { ethers } from 'ethers'
import {
  BalanceResponse,
  fetchAddressBalance,
  formatValueInGwei,
  staderNetworkChainMap,
  withErrorHandling,
} from '../endpoint/utils'

export class PermissionedPool {
  address: string
  balance?: BalanceResponse

  constructor(
    req: { permissionedPoolAddress?: string; network: string; chainId: string },
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {
    this.address =
      req.permissionedPoolAddress ||
      staderNetworkChainMap[req.network][req.chainId].permissionedPool
  }

  // TODO: the comment below is probably innacurate
  // Get inactive pool balance from Stader's StakePoolManager contract
  async fetchBalance(): Promise<BalanceResponse> {
    if (!this.balance) {
      const balance = await withErrorHandling(`Fetching permissioned pool balance`, async () =>
        formatValueInGwei(await fetchAddressBalance(this.address, this.blockTag, this.provider)),
      )
      this.balance = {
        address: this.address,
        balance,
      }
    }

    return this.balance
  }
}
