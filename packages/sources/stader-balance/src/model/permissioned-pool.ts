import { ethers } from 'ethers'
import {
  BalanceResponse,
  fetchAddressBalance,
  formatValueInGwei,
  withErrorHandling,
} from '../endpoint/utils'

export class PermissionedPool {
  balance?: BalanceResponse

  constructor(
    private address: string,
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {}

  // Get the balance from this one specific permissioned pool contract
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
