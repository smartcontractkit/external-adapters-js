import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, sleep, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config'
import { ethers } from 'ethers'
import {
  DepositEvent_ABI,
  StaderConfigContract_ABI,
  StaderPenaltyContract_ABI,
  StaderPoolFactoryContract_ABI,
} from '../abi/StaderContractAbis'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  BalanceResponse,
  buildErrorResponse,
  chunkArray,
  DEPOSIT_EVENT_LOOKBACK_WINDOW,
  DEPOSIT_EVENT_TOPIC,
  EndpointTypes,
  formatValueInGwei,
  inputParameters,
  ONE_ETH_WEI,
  ProviderResponse,
  RequestParams,
  staderNetworkChainMap,
  StaderValidatorStatus,
  ValidatorAddress,
  ValidatorState,
  WITHDRAWAL_DONE_STATUS,
} from './utils'
import BigNumber from 'bignumber.js'

const logger = makeLogger('StaderBalanceLogger')
export class BalanceTransport extends SubscriptionTransport<EndpointTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
    adapterSettings: typeof config.settings,
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.CHAIN_ID,
    )
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(
    context: EndpointContext<EndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (!entries.length) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
      return
    }
    await Promise.all(
      entries.map(async (req) => {
        const providerDataRequestedUnixMs = Date.now()
        let response: AdapterResponse<EndpointTypes['Response']>
        // Maintain map of pool ID to commission to avoid repeat contract calls
        const commissionMap: Record<number, number> = {}
        // Maintain map of pool ID to collateral ETH to avoid repeat contract calls
        const collateralEthMap: Record<number, BigNumber> = {}
        const balances: BalanceResponse[] = []
        const addresses = req.addresses
        const latestBlockNum = await this.provider.getBlockNumber()
        const blockTag = latestBlockNum - req.confirmations
        try {
          const [ethDepositContract, validatorDeposit, validatorStateList] = await Promise.all([
            this.getEthDepositContractAddress(context.adapterSettings),
            this.getValidatorDeposit(req, blockTag),
            // Return a list of validator state for every address
            this.queryValidatorBalances(req, context.adapterSettings),
            // Get inactive pool balance from Stader's StakePoolManager contract
            this.getStaderStakeManagerBalance(req, blockTag, balances),
            // Get balance of all execution layer reward addresses
            this.getElRewardBalances(req, blockTag, balances, context.adapterSettings),
            // Get balance of the Permissioned Pool address
            this.getPermissionedPoolBalance(req, blockTag, balances),
          ])

          await Promise.all([
            // Perform validator level calculations
            await this.performValidatorCalculations(
              addresses,
              validatorStateList,
              balances,
              req,
              validatorDeposit,
              ethDepositContract,
              commissionMap,
              collateralEthMap,
              blockTag,
            ),
            // Get permissionless/permissioned pool address balances
            this.getPoolAddressBalances(
              req,
              blockTag,
              balances,
              validatorDeposit,
              commissionMap,
              collateralEthMap,
            ),
          ])

          response = {
            data: {
              result: balances,
            },
            result: null,
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs,
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
          logger.error(errorMessage)
          response = buildErrorResponse(errorMessage, providerDataRequestedUnixMs)
        }

        await this.responseCache.write(this.name, [
          {
            params: req,
            response,
          },
        ])
      }),
    )
  }

  // Retrieve balances from the beacon chain for all validators in request
  async queryValidatorBalances(
    req: RequestParams,
    settings: typeof config.settings,
  ): Promise<ValidatorState[]> {
    try {
      const url = `/eth/v1/beacon/states/${req.stateId}/validators`
      const statusList = req.validatorStatus?.join(',')
      const batchSize = settings.BATCH_SIZE
      const batchedAddresses = []
      const responses: AxiosResponse<ProviderResponse>[] = []
      const result: ValidatorState[] = []
      const addresses = req.addresses
      // Separate the address set into the specified batch size
      // Add the batches as comma-separated lists to a new list used to make the requests
      for (let i = 0; i < addresses.length / batchSize; i++) {
        batchedAddresses.push(
          addresses
            .slice(i * batchSize, i * batchSize + batchSize)
            .map(({ address }) => address)
            .join(','),
        )
      }
      // Make request to beacon API for every batch
      // Break addresses down into groups to execute asynchronously
      // Firing requests for all batches all at once could hit rate limiting for large address pools
      const groupedBatches = chunkArray(batchedAddresses, settings.GROUP_SIZE)
      for (const group of groupedBatches) {
        await Promise.all(
          group.map(async (address) => {
            const options: AxiosRequestConfig = {
              baseURL: settings.BEACON_RPC_URL,
              url,
              params: { id: address, status: statusList },
            }
            return axios.request<ProviderResponse>(options).then((response) => {
              responses.push(response)
            })
          }),
        )
      }

      // Flatten the results into single array for validators and balances
      const validatorBatches = responses.map(({ data }) => data)
      validatorBatches.forEach(({ data }) => {
        data.forEach((validator) => {
          result.push(validator)
        })
      })
      return result
    } catch (e) {
      throw new Error('Failed to retrieve validator balances from Beacon chain')
    }
  }

  // Perform validator level calculations for balance on each one
  async performValidatorCalculations(
    addresses: ValidatorAddress[],
    validatorStateList: ValidatorState[],
    balances: BalanceResponse[],
    req: RequestParams,
    validatorDeposit: BigNumber,
    ethDepositContract: string,
    commissionMap: Record<number, number>,
    collateralEthMap: Record<number, BigNumber>,
    blockTag: number,
  ): Promise<void> {
    try {
      // List of addresses not found on the beacon yet
      const limboAddresses: string[] = []
      const depositedAddresses: string[] = []
      await Promise.all(
        addresses.map(async (validator) => {
          const state = validatorStateList.find(
            (validatorState) => validator.address === validatorState.validator.pubkey,
          )
          const validatorAddress = validator.address
          const withdrawalAddress = validator.withdrawVaultAddress
          if (state) {
            logger.debug(`Validator (${validatorAddress}) found on beacon`)
            const collateralEth = await this.getCollateralEth(
              validator.poolId,
              collateralEthMap,
              req,
              blockTag,
            )
            const userDeposit = validatorDeposit.minus(collateralEth)
            logger.debug(
              `Validator (${validatorAddress}): Collateral ETH: ${collateralEth}. User Deposit: ${userDeposit}`,
            )
            // Convert gwei balance from Beacon to wei to align with values from execution layer in wei
            const validatorBalance = BigNumber(
              ethers.utils.parseUnits(state.balance, 'gwei').toString(),
            )
            // Add validator to deposited address list if Stader status is DEPOSITED and balance is 1 ETH on beacon
            // Deposited address list will be used to look for 31 ETH deposit event in logs later
            if (
              validator.status === StaderValidatorStatus.DEPOSITED &&
              validatorBalance.eq(ONE_ETH_WEI)
            ) {
              logger.debug(
                `Found validator (${validatorAddress}) with DEPOSITED status and balance of 1 ETH. Will search for 31 ETH deposit event.`,
              )
              depositedAddresses.push(validatorAddress)
            }
            logger.debug(
              `Validator (${validatorAddress}) has "${state.status}" status with balance ${validatorBalance}`,
            )
            // Validator has NOT fully withdrawn
            if (WITHDRAWAL_DONE_STATUS !== state.status.toLowerCase() || validatorBalance.gt(0)) {
              let userBalancePrelim: BigNumber
              const commission = await this.getCommission(
                commissionMap,
                req,
                validator.poolId,
                blockTag,
              )

              // Validator balance greater than or equal to validator deposit. Perform calculations.
              if (validatorBalance.gte(validatorDeposit)) {
                userBalancePrelim = validatorBalance
                  .minus(validatorDeposit)
                  .times(userDeposit.div(validatorDeposit))
                  .times(1 - commission)
                  .plus(userDeposit)
                logger.debug(
                  `Non-withdrawn validator (${validatorAddress}) balance ${validatorBalance} greater than or equal to ${validatorDeposit}. Calculated user balance prelim ${userBalancePrelim}`,
                )
              }
              // Validator balance less than validator deposit but greater than or equal to user deposit. Use user deposit.
              else if (validatorBalance.gte(userDeposit)) {
                logger.debug(
                  `Non-withdrawn validator (${validatorAddress}) balance ${validatorBalance} less than ${validatorDeposit} but greater than or equal to user deposit ${userDeposit}. Using user deposit.`,
                )
                userBalancePrelim = userDeposit
              }
              // Validator balance less than validator deposit and user deposit. Use validator balance.
              else {
                logger.debug(
                  `Non-withdrawn validator (${validatorAddress}) balance ${validatorBalance} less than ${validatorDeposit} and user deposit ${userDeposit}. Using validator balance.`,
                )
                userBalancePrelim = validatorBalance
              }
              // Get penalty for validator from the Stader Penalty contract
              const penalty = await this.getPenalty(validatorAddress, req, blockTag)
              logger.debug(`Non-withdrawn validator (${validatorAddress}) penalty: ${penalty}`)
              // Calculate node balance
              const nodeBalance = BigNumber.max(
                0,
                validatorBalance.minus(userBalancePrelim).minus(penalty),
              )
              logger.debug(
                `Non-withdrawn validator (${validatorAddress}) calculated node balance: ${nodeBalance}`,
              )
              // Calculate user balance
              const userBalance = validatorBalance.minus(nodeBalance)
              logger.debug(
                `Non-withdrawn validator (${validatorAddress}) calculated user balance: ${userBalance}`,
              )
              let withdrawalBalance = await this.getAddressBalance(withdrawalAddress, blockTag)
              withdrawalBalance = withdrawalBalance
                .times(userDeposit.div(validatorDeposit))
                .times(1 - commission)
              logger.debug(
                `Non-withdrawn validator's (${validatorAddress}) withdrawal (${withdrawalAddress}) balance: ${withdrawalBalance}`,
              )
              const cumulativeBalance = withdrawalBalance.plus(userBalance)
              logger.debug(
                `Non-withdrawn validator (${validatorAddress}) cumulative balance: ${cumulativeBalance}`,
              )
              balances.push({
                address: validatorAddress,
                balance: formatValueInGwei(cumulativeBalance), // Convert to gwei for response
              })
            }
            // Validator has exited
            else {
              const withdrawalBalance = await this.getAddressBalance(withdrawalAddress, blockTag)
              logger.debug(
                `Withdrawn validator's (${validatorAddress}) withdrawal (${withdrawalAddress}) balance: ${withdrawalBalance}`,
              )
              // Withdrawal balance greater than or equal to validator deposit. Perform calculations.
              if (withdrawalBalance.gte(validatorDeposit)) {
                const commission = await this.getCommission(
                  commissionMap,
                  req,
                  validator.poolId,
                  blockTag,
                )
                const balance = withdrawalBalance
                  .minus(validatorDeposit)
                  .times(userDeposit.div(validatorDeposit))
                  .times(1 - commission)
                  .plus(userDeposit)
                logger.debug(
                  `Withdrawn validator (${validatorAddress}) withdrawal balance ${withdrawalBalance} greater than ${validatorDeposit}. Calculated balance ${balance}`,
                )
                balances.push({
                  address: validatorAddress,
                  balance: formatValueInGwei(balance), // Convert to gwei for response
                })
              }
              // Withdrawal balance less than validator deposit but greater than or equal to user deposit. Use user deposit.
              else if (withdrawalBalance.gte(userDeposit)) {
                logger.debug(
                  `Withdrawn validator (${validatorAddress}) withdrawal balance ${withdrawalBalance} less than ${validatorDeposit} but greater than or equal to user deposit ${userDeposit}. Using user deposit.`,
                )
                balances.push({
                  address: validatorAddress,
                  balance: formatValueInGwei(userDeposit),
                })
              }
              // Withdrawal balance less than validator deposit and user deposit. Use withdrawal balance.
              else {
                logger.debug(
                  `Withdrawn validator (${validatorAddress}) withdrawal balance ${withdrawalBalance} less than ${validatorDeposit} and user deposit ${userDeposit}. Using withdrawal balance.`,
                )
                balances.push({
                  address: validatorAddress,
                  balance: formatValueInGwei(withdrawalBalance),
                })
              }
            }
          } else {
            logger.debug(`Validator (${validatorAddress}) NOT found on beacon`)
            limboAddresses.push(validatorAddress)
          }
        }),
      )
      if (limboAddresses.length > 0) {
        await this.calculateLimboEthBalances(
          limboAddresses,
          depositedAddresses,
          balances,
          ethDepositContract,
          blockTag,
        )
      }
    } catch (e) {
      throw new Error('Failed to calculate balances for validators')
    }
  }

  // Get balance of all execution layer reward addresses (in wei)
  async getElRewardBalances(
    req: RequestParams,
    blockTag: number,
    balances: BalanceResponse[],
    settings: typeof config.settings,
  ): Promise<void> {
    try {
      const elRewardAddresses = req.elRewardAddresses.map(({ address }) => address)
      const groupedBatches = chunkArray(elRewardAddresses, settings.GROUP_SIZE)
      for (const group of groupedBatches) {
        await Promise.all(
          group.map((address) => {
            return this.getAddressBalance(address, blockTag).then((balance) => {
              balances.push({ address, balance: formatValueInGwei(balance) }) // Convert to gwei for response
            })
          }),
        )
      }
    } catch (e) {
      throw new Error("Failed to retrieve validators' fee recipient addresses balances")
    }
  }

  // Get permissionless/permissioned pool address balances
  async getPoolAddressBalances(
    req: RequestParams,
    blockTag: number,
    balances: BalanceResponse[],
    validatorDeposit: BigNumber,
    commissionMap: Record<number, number>,
    collateralEthMap: Record<number, BigNumber>,
  ): Promise<void> {
    try {
      await Promise.all(
        req.socialPoolAddresses.map(async (socialPool) => {
          const addressBalance = await this.getAddressBalance(socialPool.address, blockTag)
          logger.debug(
            `Social Pool (${socialPool.address}) balance on execution layer (in wei): ${addressBalance}`,
          )
          const commission = await this.getCommission(
            commissionMap,
            req,
            socialPool.poolId,
            blockTag,
          )
          const collateralEth = await this.getCollateralEth(
            socialPool.poolId,
            collateralEthMap,
            req,
            blockTag,
          )
          const userDeposit = validatorDeposit.minus(collateralEth)
          const balance = addressBalance
            .times(userDeposit.div(validatorDeposit))
            .times(1 - commission)
          logger.debug(
            `Social Pool (${socialPool.address}) calculated balance (in wei): ${balance}`,
          )
          balances.push({
            address: socialPool.address,
            balance: formatValueInGwei(balance), // Convert to gwei for response
          })
        }),
      )
    } catch (e) {
      throw new Error('Failed to retrieve balances for socializing pool addresses')
    }
  }

  // Get inactive pool balance from Stader's StakePoolManager contract
  async getStaderStakeManagerBalance(
    req: RequestParams,
    blockTag: number,
    balances: BalanceResponse[],
  ): Promise<void> {
    try {
      const stakePoolManagerContract =
        req.stakeManagerAddress || staderNetworkChainMap[req.network][req.chainId].stakePoolsManager
      const stakeManagerBalance = await this.getAddressBalance(stakePoolManagerContract, blockTag)
      logger.debug(`Balance on StakeManager contract (in wei): ${stakeManagerBalance}`)
      balances.push({
        address: stakePoolManagerContract,
        balance: formatValueInGwei(stakeManagerBalance), // Convert to gwei for response
      })
    } catch (e) {
      throw new Error('Failed to retrieve the StakeManager contract balance')
    }
  }

  // Get inactive pool balance from Stader's StakePoolManager contract
  async getPermissionedPoolBalance(
    req: RequestParams,
    blockTag: number,
    balances: BalanceResponse[],
  ): Promise<void> {
    try {
      const permissionedPool =
        req.permissionedPoolAddress ||
        staderNetworkChainMap[req.network][req.chainId].permissionedPool
      const permissionedPoolBalance = await this.getAddressBalance(permissionedPool, blockTag)
      logger.debug(`Permissioned pool balance (in wei): ${permissionedPoolBalance}`)
      balances.push({
        address: permissionedPool,
        balance: formatValueInGwei(permissionedPoolBalance), // Convert to gwei for response
      })
    } catch (e) {
      throw new Error('Failed to retrieve the StakeManager contract balance')
    }
  }

  // Get event logs to find deposit events for addresses not on the beacon chain yet
  // Returns deposit amount in wei
  async calculateLimboEthBalances(
    limboAddesses: string[],
    depositedAddresses: string[],
    balances: BalanceResponse[],
    ethDepositContract: string,
    blockTag: number,
  ): Promise<void> {
    try {
      const logs = await this.provider.getLogs({
        address: ethDepositContract,
        topics: [DEPOSIT_EVENT_TOPIC],
        fromBlock: blockTag - DEPOSIT_EVENT_LOOKBACK_WINDOW,
        toBlock: blockTag,
      })
      logger.debug(
        `Found ${logs.length} deposit events in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks`,
      )
      if (logs.length === 0) {
        limboAddesses.forEach((address) => balances.push({ address, balance: '0' }))
      } else {
        // Parse the logs from latest to oldest to find the relevant events more efficiently
        // assuming we're looking back further than we need to as a precaution
        for (let i = logs.length - 1; i >= 0; i--) {
          const log = logs[i]
          const iface = new ethers.utils.Interface(DepositEvent_ABI)
          const parsedLog = iface.parseLog(log)
          const address = parsedLog.args[0]
          const amount = BigNumber(parsedLog.args[2])
          // Look for initial deposit event for validators not found on the beacon chain
          if (limboAddesses.includes(address)) {
            logger.debug(`Found deposit event for limbo validator (${address}). Deposit: ${amount}`)
            balances.push({ address, balance: formatValueInGwei(amount) })
          }
          // Look for non-1ETH deposit event for validator with DEPOSITED status and 1 ETH balance on beacon
          // Skip 1ETH event to avoid potential double counting with balance retrieved from beacon
          else if (depositedAddresses.includes(address) && !amount.eq(ONE_ETH_WEI)) {
            logger.debug(
              `Found additional deposit event for deposited validator (${address}). Deposit: ${amount}`,
            )
            balances.push({ address, balance: formatValueInGwei(amount) })
          }
        }
      }
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to find limbo ETH for validators in limbo`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Get balance (in wei) of ETH address
  async getAddressBalance(address: string, blockTag: number): Promise<BigNumber> {
    try {
      const balance = BigNumber((await this.provider.getBalance(address, blockTag)).toString())
      logger.debug(`Address (${address}) balance: ${balance}`)
      return balance
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to retrieve address balance for ${address}`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Get penalty (in wei) for validator address from Stader's Penalty contract
  async getPenalty(
    validatorAddress: string,
    req: RequestParams,
    blockTag: number,
  ): Promise<BigNumber> {
    const penaltyAddress =
      req.penaltyAddress || staderNetworkChainMap[req.network][req.chainId].penalty
    const addressManager = new ethers.Contract(
      penaltyAddress,
      StaderPenaltyContract_ABI,
      this.provider,
    )
    try {
      return BigNumber(await addressManager.totalPenaltyAmount(validatorAddress, { blockTag }))
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to retrieve penalty for ${validatorAddress}`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Get Protocol Fee Percent from Stader Pool Factory Contract
  // Used to calculate commission
  async getProtocolFeePercent(
    poolId: number,
    req: RequestParams,
    blockTag: number,
  ): Promise<number> {
    const poolFactoryAddress =
      req.poolFactoryAddress || staderNetworkChainMap[req.network][req.chainId].poolFactory
    const addressManager = new ethers.Contract(
      poolFactoryAddress,
      StaderPoolFactoryContract_ABI,
      this.provider,
    )
    try {
      // Format in BIPS: 0-10000
      return (await addressManager.getProtocolFee(poolId, { blockTag })) / 10000
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to retrieve Protocol Fee Percent for Pool ID ${poolId}`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Get Operator Fee Percent from Stader Pool Factory Contract
  // Used to calculate commission
  async getOperatorFeePercent(
    poolId: number,
    req: RequestParams,
    blockTag: number,
  ): Promise<number> {
    const poolFactoryAddress =
      req.poolFactoryAddress || staderNetworkChainMap[req.network][req.chainId].poolFactory
    const addressManager = new ethers.Contract(
      poolFactoryAddress,
      StaderPoolFactoryContract_ABI,
      this.provider,
    )
    try {
      // Format in BIPS: 0-10000
      return (await addressManager.getOperatorFee(poolId, { blockTag })) / 10000
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to retrieve Operator Fee Percent for Pool ID ${poolId}`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Retrieve commission from map or contract to use for calculations
  // Stores values in map to avoid duplicate calls for the same pool ID
  async getCommission(
    commissionMap: Record<number, number>,
    req: RequestParams,
    poolId: number,
    blockTag: number,
  ): Promise<number> {
    try {
      if (commissionMap[poolId]) {
        const commission = commissionMap[poolId]
        logger.debug(`Pool's (${poolId}) commission: ${commission}`)
        return commission
      } else {
        const [protocolFeePercent, operatorFeePercent] = await Promise.all([
          this.getProtocolFeePercent(poolId, req, blockTag),
          this.getOperatorFeePercent(poolId, req, blockTag),
        ])
        const commission = protocolFeePercent + operatorFeePercent
        commissionMap[poolId] = commission
        logger.debug(
          `Pool's (${poolId}) protocol fee percentage: ${protocolFeePercent}, operator fee percentage: ${operatorFeePercent}, and commission percentage: ${commission}`,
        )
        return commission
      }
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to calculate commission for Pool ID ${poolId}`
      logger.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Retrieve pool's collateral eth from either the map or from the contract for the first time
  async getCollateralEth(
    poolId: number,
    collateralEthMap: Record<number, BigNumber>,
    req: RequestParams,
    blockTag: number,
  ): Promise<BigNumber> {
    if (collateralEthMap[poolId]) {
      return collateralEthMap[poolId]
    } else {
      const poolFactoryAddress =
        req.poolFactoryAddress || staderNetworkChainMap[req.network][req.chainId].poolFactory
      const addressManager = new ethers.Contract(
        poolFactoryAddress,
        StaderPoolFactoryContract_ABI,
        this.provider,
      )
      try {
        const collateralEth = BigNumber(
          String(await addressManager.getCollateralETH(poolId, { blockTag })),
        )
        collateralEthMap[poolId] = collateralEth
        return collateralEth
      } catch (e) {
        logger.error({ error: e })
        const errorMessage = `Failed to retrieve pool's (${poolId}) collateral ETH`
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }
    }
  }

  // Retrieve validator deposit from Stader contract (32 ETH in wei)
  async getValidatorDeposit(req: RequestParams, blockTag: number): Promise<BigNumber> {
    const staderConfigAddress = staderNetworkChainMap[req.network][req.chainId].staderConfig
    const addressManager = new ethers.Contract(
      staderConfigAddress,
      StaderConfigContract_ABI,
      this.provider,
    )
    try {
      return BigNumber(String(await addressManager.getStakedEthPerNode({ blockTag })))
    } catch (e) {
      logger.error({ error: e })
      throw new Error(`Failed to retrieve validator deposit size`)
    }
  }

  async getEthDepositContractAddress(settings: typeof config.settings): Promise<string> {
    const url = `/eth/v1/config/deposit_contract`
    const options: AxiosRequestConfig = {
      baseURL: settings.BEACON_RPC_URL,
      url,
    }
    try {
      const response = await axios.request<{ chainId: string; address: string }>(options)
      return response.data.address
    } catch (e) {
      logger.error({ error: e })
      throw new Error('Failed to retrieve ETH deposit contract address')
    }
  }
}

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
