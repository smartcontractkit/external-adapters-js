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
import { Pool } from './pool'

const logger = makeLogger(`StaderValidator`)

export class ValidatorFactory {
  // Retrieve balances from the beacon chain for all validators in request
  static async fetchAll(params: {
    stateId: string
    addresses: ValidatorAddress[]
    validatorStatus?: string[]
    poolMap: Record<number, Pool>
    penaltyContract: ethers.Contract
    blockTag: number
    settings: typeof config.settings
    provider: ethers.providers.JsonRpcProvider
  }): Promise<{
    activeValidators: ActiveValidator[]
    withdrawnValidators: WithdrawnValidator[]
    limboAddressMap: Record<string, ValidatorAddress>
    depositedAddressMap: Record<string, ValidatorAddress>
  }> {
    return withErrorHandling(
      `Fetching validator states (state id: ${params.stateId}) from the beacon chain`,
      async () => {
        const url = `/eth/v1/beacon/states/${params.stateId}/validators`
        const statuses = params.validatorStatus
        const statusList = statuses && statuses.length > 0 ? statuses?.join(',') : undefined
        const batchSize = params.settings.BATCH_SIZE
        const addresses = params.addresses
        const activeValidators: ActiveValidator[] = []
        const withdrawnValidators: WithdrawnValidator[] = []

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
            group.map(async (concatenatedAddresses) => {
              const response = await axios.request<ProviderResponse>({
                baseURL: params.settings.BEACON_RPC_URL,
                url,
                params: { id: concatenatedAddresses, status: statusList },
              })

              for (const state of response.data.data) {
                const validatorAddress = addressMap[state.validator.pubkey]
                const validatorBalance = BigNumber(
                  ethers.utils.parseUnits(state.balance, 'gwei').toString(),
                )
                const validatorParams = {
                  validatorBalance,
                  addressData: validatorAddress,
                  state,
                  pool: params.poolMap[validatorAddress.poolId],
                  penaltyContract: params.penaltyContract,
                  blockTag: params.blockTag,
                  provider: params.provider,
                }
                logger.debug(
                  `[Validator ${validatorAddress}] Found address on beacon chain (status: ${state.status} | balance: ${validatorBalance})`,
                )

                if (
                  state.status.toLowerCase() !== WITHDRAWAL_DONE_STATUS ||
                  validatorBalance.gt(0)
                ) {
                  activeValidators.push(new ActiveValidator(validatorParams))
                } else {
                  withdrawnValidators.push(new WithdrawnValidator(validatorParams))
                }

                delete addressMap[state.validator.pubkey]
              }
            }),
          )
        }

        // The validator addresses that had no state in the beacon chain get stuck in "limbo"
        logger.debug(
          `Number of validator addresses not found on beacon: ${Object.entries(addressMap).length}`,
        )

        // Deposited addresses will also be present in the main validator list;
        // the balance on the beacon chain for the address would be 1ETH
        // but there could be newer deposits in the event logs
        const depositedAddressMap: Record<string, ValidatorAddress> = {}
        activeValidators
          .filter((v) => v.isDeposited())
          .forEach((v) => {
            depositedAddressMap[v.addressData.address] = v.addressData
          })
        logger.debug(
          `Number of deposited validator addresses: ${Object.entries(depositedAddressMap).length}`,
        )

        // Get the validator states from the responses, flatten the groups and return
        return {
          activeValidators,
          withdrawnValidators,
          limboAddressMap: addressMap,
          depositedAddressMap,
        }
      },
    )
  }
}

type ValidatorParams = {
  addressData: ValidatorAddress
  state: ValidatorState
  pool: Pool
  penaltyContract: ethers.Contract
  blockTag: number
  provider: ethers.providers.JsonRpcProvider
  validatorBalance: BigNumber
}

abstract class Validator {
  validatorBalance: BigNumber
  addressData: ValidatorAddress
  protected state: ValidatorState
  protected pool: Pool
  protected penaltyContract: ethers.Contract
  protected blockTag: number
  protected provider: ethers.providers.JsonRpcProvider
  protected logPrefix: string

  abstract calculateBalance(
    validatorDeposit: BigNumber,
    depositedBalanceMap: Record<string, BigNumber>,
  ): Promise<BalanceResponse>

  constructor(params: ValidatorParams) {
    this.addressData = params.addressData
    this.state = params.state
    this.pool = params.pool
    this.penaltyContract = params.penaltyContract
    this.blockTag = params.blockTag
    this.provider = params.provider
    this.validatorBalance = params.validatorBalance
    this.logPrefix = `[Validator ${this.state.validator.pubkey}]`
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

  // Active validators will send the validatorDeposit as the balance;
  // withdrawn validators will send the withdrawnAddress balance instead
  protected calculatePreliminaryBalance({
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

  protected async fetchDataForBalanceCalculation(
    validatorDeposit: BigNumber,
    depositedBalances?: Record<string, BigNumber>,
  ) {
    // Fetch amount of collateral eth specified in the pool and subtract it from the validator deposit
    const collateralEth = await this.pool.fetchCollateralEth()
    const userDeposit = validatorDeposit.minus(collateralEth)
    logger.debug(
      `${this.logPrefix} Pool collateral ETH: ${collateralEth} | User deposit: ${userDeposit}`,
    )

    // Get all other necessary data to calculate the balances
    const poolCommission = await this.pool.fetchTotalCommissionPercentage()
    const withdrawalAddressBalance = await this.fetchWithdrawalAddressBalance()

    let depositedEth = BigNumber(0)
    if (depositedBalances) {
      const depositeBalance = depositedBalances[this.addressData.address]
      // Deposit event balance is maintained in wei so conversion is not needed here
      depositedEth = depositeBalance || BigNumber(0)
    }

    return {
      userDeposit,
      poolCommission,
      withdrawalAddressBalance,
      depositedEth,
    }
  }
}

class ActiveValidator extends Validator {
  async calculateBalance(
    validatorDeposit: BigNumber,
    depositedBalanceMap: Record<string, BigNumber>,
  ): Promise<BalanceResponse> {
    logger.debug(`${this.logPrefix} validator is not done or balance > 0, considering it active`)
    const { userDeposit, poolCommission, withdrawalAddressBalance, depositedEth } =
      await this.fetchDataForBalanceCalculation(validatorDeposit, depositedBalanceMap)

    // Get the current penalty for this validator from the Stader Penalty contract
    const validatorPenalty = await this.fetchPenalty()
    logger.debug(
      `Validator (${this.addressData.address}), 
      User deposit: ${userDeposit}. 
      Pool Commission: ${poolCommission}. 
      Withdrawal balance: ${withdrawalAddressBalance}. 
      Deposited Eth: ${depositedEth}`,
    )
    // Add deposited ETH to balance found on beacon
    // Limbo ETH should be included in the calculations
    const effectiveBalance = this.validatorBalance.plus(depositedEth)
    // Calculate the preliminary user balance
    const preliminaryUserBalance = this.calculatePreliminaryBalance({
      balance: effectiveBalance,
      validatorDeposit,
      poolCommission,
      userDeposit,
    })
    logger.debug(`${this.logPrefix} calculated preliminary user balance: ${preliminaryUserBalance}`)

    // Calculate the node's balance
    const nodeBalance = BigNumber.max(
      0,
      effectiveBalance.minus(preliminaryUserBalance).minus(validatorPenalty),
    )
    logger.debug(`${this.logPrefix} calculated node balance: ${nodeBalance}`)

    // Calculate user balance
    const userBalance = effectiveBalance.minus(nodeBalance)
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
}

class WithdrawnValidator extends Validator {
  async calculateBalance(validatorDeposit: BigNumber): Promise<BalanceResponse> {
    const { userDeposit, poolCommission, withdrawalAddressBalance } =
      await this.fetchDataForBalanceCalculation(validatorDeposit)

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
