import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { StaderConfigContract_ABI } from '../abi/StaderContractAbis'
import { RequestParams, staderNetworkChainMap, withErrorHandling } from '../endpoint/utils'

export class StaderConfig {
  address: string
  addressManager: ethers.Contract
  validatorDeposit?: BigNumber

  constructor(
    req: RequestParams,
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {
    this.address =
      req.staderConfigAddress || staderNetworkChainMap[req.network][req.chainId].staderConfig

    this.addressManager = new ethers.Contract(this.address, StaderConfigContract_ABI, this.provider)
  }

  async fetchContractAddresses(
    req: RequestParams,
    blockTag: number,
  ): Promise<{
    poolFactoryAddress: string
    penaltyAddress: string
    stakeManagerAddress: string
    permissionedPoolAddress: string
  }> {
    return withErrorHandling(
      'Fetching contract addresses from the StaderConfig contract',
      async () => {
        // Fetch default contract addresses from the StaderConfig contract
        const [
          poolFactoryDefault,
          penaltyDefault,
          stakePoolsManagerDefault,
          permissionedPoolDefault,
        ] = await Promise.all([
          this.addressManager.getPoolUtils({ blockTag }),
          this.addressManager.getPenaltyContract({ blockTag }),
          this.addressManager.getStakePoolManager({ blockTag }),
          this.addressManager.getPermissionedPool({ blockTag }),
        ])

        const poolFactoryAddress = req.poolFactoryAddress || poolFactoryDefault
        const penaltyAddress = req.penaltyAddress || penaltyDefault
        const stakeManagerAddress = req.stakeManagerAddress || stakePoolsManagerDefault
        const permissionedPoolAddress = req.permissionedPoolAddress || permissionedPoolDefault

        // Apply overrides to return the
        return { poolFactoryAddress, penaltyAddress, stakeManagerAddress, permissionedPoolAddress }
      },
    )
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
