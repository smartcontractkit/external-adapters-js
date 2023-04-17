import { makeLogger } from '@chainlink/external-adapter-framework/util'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { config } from '../config'
import {
  BalanceResponse,
  batchValidatorAddresses,
  chunkArray,
  fetchAddressBalance,
  formatValueInGwei,
  ONE_ETH_WEI,
  ProviderResponse,
  StaderValidatorStatus,
  ValidatorAddress,
  ValidatorState,
  WITHDRAWAL_DONE_STATUS,
  withErrorHandling,
} from '../endpoint/utils'
import { SocialPool } from './social-pool'

const logger = makeLogger(`StaderValidator`)

export class Validator {
  validatorBalance: BigNumber
  private addressData: ValidatorAddress
  private state: ValidatorState
  private pool: SocialPool
  private penaltyContract: ethers.Contract
  private blockTag: number
  private provider: ethers.providers.JsonRpcProvider
  private logPrefix: string

  constructor(params: {
    addressData: ValidatorAddress
    state: ValidatorState
    pool: SocialPool
    penaltyContract: ethers.Contract
    blockTag: number
    provider: ethers.providers.JsonRpcProvider
  }) {
    this.addressData = params.addressData
    this.state = params.state
    this.pool = params.pool
    this.penaltyContract = params.penaltyContract
    this.blockTag = params.blockTag
    this.provider = params.provider
    this.logPrefix = `[Validator ${this.state.validator.pubkey}]`

    // Convert gwei balance from Beacon to wei to align with values from execution layer in wei
    this.validatorBalance = BigNumber(
      ethers.utils.parseUnits(this.state.balance, 'gwei').toString(),
    )
    logger.debug(
      `${this.logPrefix} Found address on beacon chain (status: ${this.state.status} | balance: ${this.validatorBalance})`,
    )
  }

  async calculateBalance(validatorDeposit: BigNumber): Promise<BalanceResponse> {
    // Fetch amount of collateral eth specified in the pool and subtract it from the validator deposit
    const collateralEth = await this.pool.fetchCollateralEth()
    const userDeposit = validatorDeposit.minus(collateralEth)
    logger.debug(
      `${this.logPrefix} Pool collateral ETH: ${collateralEth} | User deposit: ${userDeposit}`,
    )

    // Get all other necessary data to calculate the balances
    const poolCommission = await this.pool.fetchTotalCommissionPercentage()
    const withdrawalAddressBalance = await this.fetchWithdrawalAddressBalance()

    // There are two options for a validator that was found on the beacon chain, which need different calculations
    // - The validator still has ETH deposited, and is considered active
    // - The validator has fully withdrawn its deposit
    if (this.state.status.toLowerCase() !== WITHDRAWAL_DONE_STATUS || this.validatorBalance.gt(0)) {
      logger.debug(`${this.logPrefix} validator is not done or balance > 0, considering it active`)
      // Get the current penalty for this validator from the Stader Penalty contract
      const validatorPenalty = await this.fetchPenalty()

      // Calculate the preliminary user balance
      const preliminaryUserBalance = this.calculatePreliminaryBalance({
        balance: this.validatorBalance,
        validatorDeposit,
        poolCommission,
        userDeposit,
      })
      logger.debug(
        `${this.logPrefix} calculated preliminary user balance: ${preliminaryUserBalance}`,
      )

      // Calculate the node's balance
      const nodeBalance = BigNumber.max(
        0,
        this.validatorBalance.minus(preliminaryUserBalance).minus(validatorPenalty),
      )
      logger.debug(`${this.logPrefix} calculated node balance: ${nodeBalance}`)

      // Calculate user balance
      const userBalance = this.validatorBalance.minus(nodeBalance)
      logger.debug(`${this.logPrefix} calculated user balance: ${userBalance}`)

      // Calculate withdrawal balance
      const withdrawalBalance = withdrawalAddressBalance
        .times(userDeposit.div(validatorDeposit))
        .times(1 - poolCommission)
      logger.debug(`${this.logPrefix} calculated withdrawal balance: ${withdrawalBalance}`)

      // Calculate cumulative balance
      // NOTE: We could technically report the user and withdrawal balance separately, but PoR will sum everything anyways
      const cumulativeBalance = withdrawalBalance.plus(userBalance)
      logger.debug(`${this.logPrefix} calculated cumulative balance: ${cumulativeBalance}`)

      return {
        address: this.addressData.address,
        balance: formatValueInGwei(cumulativeBalance),
      }
    } else {
      logger.debug(`${this.logPrefix} considering validator fully withdrawn`)
      const balance = this.calculatePreliminaryBalance({
        balance: withdrawalAddressBalance,
        validatorDeposit,
        poolCommission,
        userDeposit,
      })

      logger.debug(`${this.logPrefix} calculated balance: ${balance}`)
      return {
        address: this.addressData.address,
        balance: formatValueInGwei(balance),
      }
    }
  }

  // Active validators will send the validatorDeposit as the balance;
  // withdrawn validators will send the withdrawnAddress balance instead
  private calculatePreliminaryBalance({
    balance,
    validatorDeposit,
    poolCommission,
    userDeposit,
  }: {
    balance: BigNumber
    validatorDeposit: BigNumber
    poolCommission: number
    userDeposit: BigNumber
  }) {
    if (balance.gte(validatorDeposit)) {
      const calcExpr =
        '(balance - validatorDeposit) * (userDeposit / validatorDeposit) * (1 - poolCommission) + userDeposit'
      logger.debug(
        `${this.logPrefix} balance ${balance} greater than or equal to ${validatorDeposit}. Using: ${calcExpr}`,
      )
      return balance
        .minus(validatorDeposit)
        .times(userDeposit.div(validatorDeposit))
        .times(1 - poolCommission)
        .plus(userDeposit)
    } else if (balance.gte(userDeposit)) {
      logger.debug(
        `${this.logPrefix} balance ${balance} less than ${validatorDeposit} but greater than or equal to user deposit ${userDeposit}. Using user deposit.`,
      )
      return userDeposit
    } else {
      logger.debug(
        `${this.logPrefix} balance ${balance} less than ${validatorDeposit} and user deposit ${userDeposit}. Using validator balance.`,
      )
      return balance
    }
  }

  isDeposited(): boolean {
    return (
      this.addressData.status === StaderValidatorStatus.DEPOSITED &&
      this.validatorBalance.eq(ONE_ETH_WEI)
    )
  }

  async fetchWithdrawalAddressBalance(): Promise<BigNumber> {
    return withErrorHandling(`${this.logPrefix} Fetching withdrawal address balance`, () =>
      fetchAddressBalance(this.addressData.withdrawVaultAddress, this.blockTag, this.provider),
    )
  }

  // Get penalty (in wei) for validator address from Stader's Penalty contract
  async fetchPenalty(): Promise<BigNumber> {
    return withErrorHandling(`${this.logPrefix} Fetching validator penalty`, async () =>
      BigNumber(
        (
          await this.penaltyContract.totalPenaltyAmount(this.addressData.address, {
            blockTag: this.blockTag,
          })
        ).toString(),
      ),
    )
  }

  // Retrieve balances from the beacon chain for all validators in request
  static async fetchAll(params: {
    stateId: string
    addresses: ValidatorAddress[]
    validatorStatus?: string[]
    socialPoolMap: Record<number, SocialPool>
    penaltyContract: ethers.Contract
    blockTag: number
    settings: typeof config.settings
    provider: ethers.providers.JsonRpcProvider
  }): Promise<{
    validators: Validator[]
    limboAddresses: string[]
    depositedAddresses: string[]
  }> {
    return withErrorHandling(
      `Fetching validator states (state id: ${params.stateId}) from the beacon chain`,
      async () => {
        const url = `/eth/v1/beacon/states/${params.stateId}/validators`
        const statusList = params.validatorStatus?.join(',')
        const batchSize = params.settings.BATCH_SIZE
        const addresses = params.addresses
        const validators: Validator[] = []

        // Put the validator addresses into a map so we can map the response later
        const addressMap = {} as Record<string, ValidatorAddress>
        for (const address of addresses) {
          addressMap[address.address] = address
        }

        // First, separate the validator addresses into batches.
        // Each one of these will be an RPC call to the beacon
        const batchedAddresses = batchValidatorAddresses(addresses, batchSize)

        // Then, send a group of those requests in parallel and wait to avoid overloading the node
        const groupedBatches = chunkArray(batchedAddresses, params.settings.GROUP_SIZE)
        for (const group of groupedBatches) {
          await Promise.all(
            group.map(async (address) => {
              const response = await axios.request<ProviderResponse>({
                baseURL: params.settings.BEACON_RPC_URL,
                url,
                params: { id: address, status: statusList },
              })

              for (const state of response.data.data) {
                const validatorAddress = addressMap[state.validator.pubkey]
                validators.push(
                  new Validator({
                    addressData: validatorAddress,
                    state,
                    pool: params.socialPoolMap[validatorAddress.poolId],
                    penaltyContract: params.penaltyContract,
                    blockTag: params.blockTag,
                    provider: params.provider,
                  }),
                )
                delete addressMap[state.validator.pubkey]
              }
            }),
          )
        }

        // The validator addresses that had no state in the beacon chain get stuck in "limbo"
        const limboAddresses = Object.values(addressMap).map((a) => a.address)
        logger.debug(`Number of validator addresses not found on beacon: ${limboAddresses.length}`)

        // Deposited addresses will also be present in the main validator list;
        // the balance on the beacon chain for the address would be 1ETH
        // but there could be newer deposits in the event logs
        const depositedAddresses = validators
          .filter((v) => v.isDeposited())
          .map((v) => v.addressData.address)
        logger.debug(`Number of deposited validator addresses: ${limboAddresses.length}`)

        // Get the validator states from the responses, flatten the groups and return
        return {
          validators,
          limboAddresses,
          depositedAddresses,
        }
      },
    )
  }
}
