import { ethers } from 'ethers'
import {
  BalanceResponse,
  fetchAddressBalance,
  formatValueInGwei,
  withErrorHandling,
} from '../endpoint/utils'

export class StakeManager {
  balance?: BalanceResponse

  constructor(
    private address: string,
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {}

  // Get inactive pool balance from Stader's StakePoolManager contract
  async fetchBalance(): Promise<BalanceResponse> {
    if (!this.balance) {
      const balance = await withErrorHandling(`Fetching stake pool balance`, async () =>
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
