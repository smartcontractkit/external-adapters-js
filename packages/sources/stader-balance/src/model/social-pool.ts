import { makeLogger } from '@chainlink/external-adapter-framework/util'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { StaderPoolFactoryContract_ABI } from '../abi/StaderContractAbis'
import {
  BalanceResponse,
  fetchAddressBalance,
  formatValueInGwei,
  PoolAddress,
  staderNetworkChainMap,
  withErrorHandling,
} from '../endpoint/utils'

const logger = makeLogger(`SocialPool`)

export class SocialPool {
  collateralEth?: BigNumber
  // operatorFeePercentage?: number
  // protocolFeePercentage?: number
  totalCommissionPercentage?: number
  addressBalance?: number

  id: number
  private address: string
  private blockTag: number
  private provider: ethers.providers.JsonRpcProvider
  private poolFactoryManager: ethers.Contract
  private logPrefix: string

  constructor(params: {
    poolId: number
    blockTag: number
    address: string
    poolFactoryAddress?: string
    network: string
    chainId: string
    provider: ethers.providers.JsonRpcProvider
  }) {
    this.id = params.poolId
    this.address = params.address
    this.blockTag = params.blockTag
    this.provider = params.provider
    this.logPrefix = `[Pool ${this.id}]`

    const contractAddress =
      params.poolFactoryAddress || staderNetworkChainMap[params.network][params.chainId].poolFactory
    this.poolFactoryManager = new ethers.Contract(
      contractAddress,
      StaderPoolFactoryContract_ABI,
      params.provider,
    )
  }

  async fetchBalance(validatorDeposit: BigNumber): Promise<BalanceResponse> {
    // Fetch data
    const addressBalance = await this.fetchAddressBalance()
    const commission = await this.fetchTotalCommissionPercentage()
    const collateralEth = await this.fetchCollateralEth()

    // Calculate the balance
    const userDeposit = validatorDeposit.minus(collateralEth)
    const balance = addressBalance.times(userDeposit.div(validatorDeposit)).times(1 - commission)

    logger.debug(`${this.logPrefix} calculated balance (in wei): ${balance}`)
    return {
      address: this.address,
      balance: formatValueInGwei(balance), // Convert to gwei for response
    }
  }

  async fetchAddressBalance(): Promise<BigNumber> {
    return withErrorHandling(`${this.logPrefix} Fetching address balance`, async () =>
      fetchAddressBalance(this.address, this.blockTag, this.provider),
    )
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

  static buildAll(
    params: {
      socialPoolAddresses: PoolAddress[]
      poolFactoryAddress?: string
      network: string
      chainId: string
    },
    blockTag: number,
    provider: ethers.providers.JsonRpcProvider,
  ): {
    socialPools: SocialPool[]
    socialPoolMap: Record<number, SocialPool>
  } {
    const socialPoolMap: Record<number, SocialPool> = {}
    const socialPools = params.socialPoolAddresses.map((address) => {
      const pool = new SocialPool({
        ...params,
        ...address,
        blockTag,
        provider,
      })

      // Add pool to map to
      socialPoolMap[pool.id] = pool

      return pool
    })

    return {
      socialPools,
      socialPoolMap,
    }
  }
}
