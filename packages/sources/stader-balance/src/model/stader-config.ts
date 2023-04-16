import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { StaderConfigContract_ABI } from '../abi/StaderContractAbis'
import { staderNetworkChainMap, withErrorHandling } from '../endpoint/utils'

export class StaderConfig {
  address: string
  addressManager: ethers.Contract
  validatorDeposit?: BigNumber

  constructor(
    req: { stakeManagerAddress?: string; network: string; chainId: string },
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {
    this.address =
      req.stakeManagerAddress || staderNetworkChainMap[req.network][req.chainId].stakePoolsManager

    this.addressManager = new ethers.Contract(this.address, StaderConfigContract_ABI, this.provider)
  }

  async fetchValidatorDeposit(): Promise<BigNumber> {
    if (!this.validatorDeposit) {
      this.validatorDeposit = await withErrorHandling(
        `Fetching config contract validator deposit`,
        async () =>
          BigNumber(
            String(await this.addressManager.getStakedEthPerNode({ blockTag: this.blockTag })),
          ),
      )
    }

    return this.validatorDeposit
  }
}
