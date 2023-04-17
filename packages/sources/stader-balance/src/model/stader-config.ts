import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { StaderConfigContract_ABI } from '../abi/StaderContractAbis'
import { staderNetworkChainMap, withErrorHandling } from '../endpoint/utils'

export class StaderConfig {
  address: string
  addressManager: ethers.Contract
  validatorDeposit?: BigNumber

  constructor(
    req: { staderConfig?: string; network: string; chainId: string },
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {
    this.address = req.staderConfig || staderNetworkChainMap[req.network][req.chainId].staderConfig

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
