import { makeLogger } from '@chainlink/external-adapter-framework/util'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { StaderPoolFactoryContract_ABI, StaderSocialPool_ABI } from '../abi/StaderContractAbis'
import {
  BalanceResponse,
  fetchAddressBalance,
  formatValueInGwei,
  PoolAddress,
  withErrorHandling,
} from '../endpoint/utils'

const logger = makeLogger(`Pool`)

export class Pool {
  collateralEth?: BigNumber
  totalCommissionPercentage?: number
  addressBalance?: number

  id: number
  protected blockTag: number
  protected provider: ethers.providers.JsonRpcProvider
  private poolFactoryManager: ethers.Contract
  protected logPrefix: string

  constructor(params: {
    poolId: number
    blockTag: number
    poolFactoryAddress: string
    network: string
    chainId: string
    provider: ethers.providers.JsonRpcProvider
  }) {
    this.id = params.poolId
    this.blockTag = params.blockTag
    this.provider = params.provider
    this.logPrefix = `[Pool ${this.id}]`
    this.poolFactoryManager = Pool.buildPoolFactoryManager(params.poolFactoryAddress, this.provider)
  }

  // Retrieve the pool's collateral ETH from the Stader Pool Factory contract
  async fetchCollateralEth(): Promise<BigNumber> {
    if (!this.collateralEth) {
      this.collateralEth = await withErrorHandling(
        `${this.logPrefix} Fetching collateral ETH`,
        async () =>
          BigNumber(
            String(
              await this.poolFactoryManager.getCollateralETH(this.id, { blockTag: this.blockTag }),
            ),
          ),
      )
    }

    return this.collateralEth
  }

  async fetchTotalCommissionPercentage(): Promise<number> {
    if (!this.totalCommissionPercentage) {
      this.totalCommissionPercentage = await withErrorHandling(
        `${this.logPrefix} Fetching and calculating all data`,
        async () => {
          // Get the fee percentages from the pool manager contract
          const [operatorFeePercentage, protocolFeePercentage] = await Promise.all([
            this.fetchOperatorFeePercentage(),
            this.fetchProtocolFeePercentage(),
          ])

          // Calculate the total commission
          return operatorFeePercentage + protocolFeePercentage
        },
      )
    }

    return this.totalCommissionPercentage
  }

  // Retrieve the pool's operator fee from the Stader Pool Factory contract and calculate the percentage
  async fetchOperatorFeePercentage(): Promise<number> {
    return withErrorHandling(
      `${this.logPrefix} Fetching operator fee percentage`,
      async () =>
        // Format in BIPS: 0-10000
        (await this.poolFactoryManager.getOperatorFee(this.id, { blockTag: this.blockTag })) /
        10000,
    )
  }

  // Get protocol fee percentage from Stader Pool Factory Contract, used to calculate commission
  async fetchProtocolFeePercentage(): Promise<number> {
    return withErrorHandling(
      `${this.logPrefix} Fetching protocol fee percentage`,
      async () =>
        // Format in BIPS: 0-10000
        (await this.poolFactoryManager.getProtocolFee(this.id, { blockTag: this.blockTag })) /
        10000,
    )
  }

  static async buildAll(
    params: {
      socialPoolAddresses: PoolAddress[]
      poolFactoryAddress: string
      network: string
      chainId: string
    },
    blockTag: number,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<{
    socialPools: SocialPool[]
    poolMap: Record<number, Pool>
  }> {
    const poolMap: Record<number, Pool> = {}
    const socialPools: SocialPool[] = []
    const poolFactoryManager = Pool.buildPoolFactoryManager(params.poolFactoryAddress, provider)
    const poolIdArray = await poolFactoryManager.getPoolIdArray({ blockTag })
    for (let i = 0; i < poolIdArray.length; i++) {
      const poolId = poolIdArray[i]
      const socialContractAddress = params.socialPoolAddresses.find(
        (address) => address.poolId === poolId,
      )
      if (socialContractAddress) {
        const socialPool = new SocialPool(
          {
            ...params,
            poolId,
            blockTag,
            provider,
          },
          socialContractAddress.address,
        )
        poolMap[poolId] = socialPool
        socialPools.push(socialPool)
      } else {
        poolMap[poolId] = new Pool({
          ...params,
          poolId,
          blockTag,
          provider,
        })
      }
    }

    return {
      socialPools,
      poolMap,
    }
  }

  static buildPoolFactoryManager(
    poolFactoryAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): ethers.Contract {
    return new ethers.Contract(poolFactoryAddress, StaderPoolFactoryContract_ABI, provider)
  }
}

class SocialPool extends Pool {
  private socialPoolManager: ethers.Contract

  constructor(
    params: {
      poolId: number
      blockTag: number
      poolFactoryAddress: string
      network: string
      chainId: string
      provider: ethers.providers.JsonRpcProvider
    },
    private socialContractAddress: string,
  ) {
    super(params)
    this.socialPoolManager = this.buildSocialPoolManager(socialContractAddress, this.provider)
  }

  buildSocialPoolManager(
    socialContractAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): ethers.Contract {
    return new ethers.Contract(socialContractAddress, StaderSocialPool_ABI, provider)
  }

  async fetchBalance(validatorDeposit: BigNumber): Promise<BalanceResponse> {
    // Fetch data
    const addressBalance = await this.fetchAddressBalance()
    const commission = await this.fetchTotalCommissionPercentage()
    const collateralEth = await this.fetchCollateralEth()
    const operatorEthReward = await this.fetchRemainingOperatorEthRewards()

    // Calculate the balance
    const userDeposit = validatorDeposit.minus(collateralEth)
    const adjustedBalance = addressBalance.minus(operatorEthReward)
    const balance = adjustedBalance.times(userDeposit.div(validatorDeposit)).times(1 - commission)

    logger.debug(`${this.logPrefix} calculated balance (in wei): ${balance}`)
    return {
      address: this.socialContractAddress,
      balance: formatValueInGwei(balance), // Convert to gwei for response
    }
  }

  async fetchAddressBalance(): Promise<BigNumber> {
    return withErrorHandling(`${this.logPrefix} Fetching address balance`, async () =>
      fetchAddressBalance(this.socialContractAddress, this.blockTag, this.provider),
    )
  }

  async fetchRemainingOperatorEthRewards(): Promise<BigNumber> {
    return withErrorHandling(
      `${this.logPrefix} Fetching remaining operator ETH rewards`,
      async () =>
        BigNumber(
          String(
            await this.socialPoolManager.totalOperatorETHRewardsRemaining({
              blockTag: this.blockTag,
            }),
          ),
        ),
    )
  }
}
