import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import {
  DepositEvent_ABI,
  StaderConfigContract_ABI,
  StaderPenaltyContract_ABI,
  StaderPoolFactoryContract_ABI,
} from '../abi/StaderContractAbis'
import { config } from '../config'
import {
  BalanceResponse,
  batchValidatorAddresses,
  chunkArray,
  DEPOSIT_EVENT_LOOKBACK_WINDOW,
  DEPOSIT_EVENT_TOPIC,
  EndpointTypes,
  formatValueInGwei,
  FunctionParameters,
  inputParameters,
  ONE_ETH_WEI,
  parseLittleEndian,
  ProviderResponse,
  RequestParams,
  staderNetworkChainMap,
  StaderValidatorStatus,
  ValidatorAddress,
  ValidatorState,
  WITHDRAWAL_DONE_STATUS,
} from './utils'

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
    await Promise.all(entries.map(async (req) => this.handleRequest(req, context)))
  }

  async handleRequest(req: RequestParams, context: EndpointContext<EndpointTypes>): Promise<void> {
    let response: AdapterResponse<EndpointTypes['Response']>
    try {
      response = await this._handleRequest(req, context)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: req, response }])
  }

  async _handleRequest(
    req: RequestParams,
    context: EndpointContext<EndpointTypes>,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    // Maintain map of pool ID to commission to avoid repeat contract calls
    const commissionMap: Record<number, number> = {}

    // Maintain map of pool ID to collateral ETH to avoid repeat contract calls
    const collateralEthMap: Record<number, BigNumber> = {}

    // We're making a lot of requests in this complex logic, so we start counting the time
    // it takes for the provider to reply from here, accounting for all requests involved
    const providerDataRequestedUnixMs = Date.now()

    // Get data for the latest block in the chain
    const latestBlockNum = await this.provider.getBlockNumber()
    const blockTag = latestBlockNum - req.confirmations

    // Fetch as much data in parallel as we can
    const [
      ethDepositContract,
      validatorDeposit,
      validatorStateList,
      stakeManagerBalance,
      elRewardBalances,
      permissionedPoolBalance,
    ] = await Promise.all([
      this.getEthDepositContractAddress(context.adapterSettings),
      this.getValidatorDeposit(req, blockTag),
      // Return a list of validator state for every address
      this.queryValidatorStates(req, context.adapterSettings),
      // Get inactive pool balance from Stader's StakePoolManager contract
      this.getStaderStakeManagerBalance(req, blockTag),
      // Get balance of all execution layer reward addresses
      this.getElRewardBalances(req, blockTag, context.adapterSettings),
      // Get balance of the Permissioned Pool address
      this.getPermissionedPoolBalance(req, blockTag),
    ])

    const params: FunctionParameters = {
      addresses: req.addresses,
      validatorStateList,
      req,
      validatorDeposit,
      ethDepositContract,
      blockTag,
      commissionMap,
      collateralEthMap,
    }

    // Perform the final calculations
    const [validatorBalances, poolAddressBalances] = await Promise.all([
      // Perform validator level calculations
      this.performValidatorCalculations(params),
      // Get permissionless/permissioned pool address balances
      this.getPoolAddressBalances(params),
    ])

    // Flatten all the balances out, they'll be aggregated in the proof-of-reserves EA
    const balances = [
      stakeManagerBalance,
      elRewardBalances,
      permissionedPoolBalance,
      validatorBalances,
      poolAddressBalances,
    ].flat()

    return {
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
  }

  // Retrieve balances from the beacon chain for all validators in request
  async queryValidatorStates(
    req: RequestParams,
    settings: typeof config.settings,
  ): Promise<ValidatorState[]> {
    try {
      const url = `/eth/v1/beacon/states/${req.stateId}/validators`
      const statusList = req.validatorStatus?.join(',')
      const batchSize = settings.BATCH_SIZE
      const addresses = req.addresses
      let responses: AxiosResponse<ProviderResponse>[] = []

      // First, separate the validator addresses into batches.
      // Each one of these will be an RPC call to the beacon
      const batchedAddresses = batchValidatorAddresses(addresses, batchSize)

      // Then, send a group of those requests in parallel and wait to avoid overloading the node
      const groupedBatches = chunkArray(batchedAddresses, settings.GROUP_SIZE)
      for (const group of groupedBatches) {
        responses = responses.concat(
          await Promise.all(
            group.map(async (address) =>
              axios.request({
                baseURL: settings.BEACON_RPC_URL,
                url,
                params: { id: address, status: statusList },
              }),
            ),
          ),
        )
      }

      // Get the validator states from the responses, flatten the groups and return
      return responses.map((r) => r.data.data).flat()
    } catch (e) {
      throw new Error('Failed to retrieve validator balances from Beacon chain')
    }
  }

  // Perform validator level calculations for balance on each one
  async performValidatorCalculations(params: FunctionParameters): Promise<BalanceResponse[]> {
    try {
      // List of addresses not found on the beacon yet
      const limboAddresses: string[] = []
      const depositedAddresses: string[] = []
      const balances: BalanceResponse[] = []
      await Promise.all(
        params.addresses.map(async (validator) =>
          this.calculateValidatorBalance({
            ...params,
            validator,
            balances,
            limboAddresses,
            depositedAddresses,
          }),
        ),
      )
      if (limboAddresses.length > 0 || depositedAddresses.length > 0) {
        await this.calculateLimboEthBalances({
          ...params,
          balances,
          limboAddresses,
          depositedAddresses,
        })
      }
      return balances
    } catch (e) {
      throw new Error('Failed to calculate balances for validators')
    }
  }

  async calculateValidatorBalance(
    params: FunctionParameters & {
      validator: ValidatorAddress
      balances: BalanceResponse[]
      limboAddresses: string[]
      depositedAddresses: string[]
    },
  ): Promise<void> {
    const {
      req,
      validator,
      validatorDeposit,
      balances,
      collateralEthMap,
      depositedAddresses,
      limboAddresses,
      commissionMap,
      blockTag,
    } = params
    const state = params.validatorStateList.find(
      (validatorState) => validator.address === validatorState.validator.pubkey,
    )
    const validatorAddress = validator.address
    const withdrawalAddress = validator.withdrawVaultAddress
    if (state) {
      logger.debug(`Validator (${validatorAddress}) found on beacon`)
      const collateralEth = await this.getCollateralEth(
        validator.poolId,
        collateralEthMap,
        params.req,
        params.blockTag,
      )
      const userDeposit = params.validatorDeposit.minus(collateralEth)
      logger.debug(
        `Validator (${validatorAddress}): Collateral ETH: ${collateralEth}. User Deposit: ${userDeposit}`,
      )
      // Convert gwei balance from Beacon to wei to align with values from execution layer in wei
      const validatorBalance = BigNumber(ethers.utils.parseUnits(state.balance, 'gwei').toString())
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
        const commission = await this.getCommission(commissionMap, req, validator.poolId, blockTag)

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

        // Calculate withdrawal balance
        const withdrawalBalance = (await this.getAddressBalance(withdrawalAddress, blockTag))
          .times(userDeposit.div(validatorDeposit))
          .times(1 - commission)
        logger.debug(
          `Non-withdrawn validator's (${validatorAddress}) withdrawal (${withdrawalAddress}) balance: ${withdrawalBalance}`,
        )

        // Calculate cumulative balance
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
  }

  // Get balance of all execution layer reward addresses (in wei)
  async getElRewardBalances(
    req: RequestParams,
    blockTag: number,
    settings: typeof config.settings,
  ): Promise<BalanceResponse[]> {
    const balances: BalanceResponse[] = []
    const elRewardAddresses = req.elRewardAddresses.map(({ address }) => address)
    const groupedBatches = chunkArray(elRewardAddresses, settings.GROUP_SIZE)

    try {
      for (const group of groupedBatches) {
        await Promise.all(
          group.map(async (address) => {
            const balance = await this.getAddressBalance(address, blockTag)
            balances.push({ address, balance: formatValueInGwei(balance) })
          }),
        )
      }
    } catch (e) {
      throw new Error("Failed to retrieve validators' fee recipient addresses balances")
    }

    return balances
  }

  // Get permissionless/permissioned pool address balances
  async getPoolAddressBalances({
    req,
    blockTag,
    validatorDeposit,
    commissionMap,
    collateralEthMap,
  }: {
    req: RequestParams
    blockTag: number
    validatorDeposit: BigNumber
    commissionMap: Record<number, number>
    collateralEthMap: Record<number, BigNumber>
  }): Promise<BalanceResponse[]> {
    try {
      return await Promise.all(
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
          return {
            address: socialPool.address,
            balance: formatValueInGwei(balance), // Convert to gwei for response
          }
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
  ): Promise<BalanceResponse[]> {
    try {
      const stakePoolManagerContract =
        req.stakeManagerAddress || staderNetworkChainMap[req.network][req.chainId].stakePoolsManager
      const stakeManagerBalance = await this.getAddressBalance(stakePoolManagerContract, blockTag)
      logger.debug(`Balance on StakeManager contract (in wei): ${stakeManagerBalance}`)
      return [
        {
          address: stakePoolManagerContract,
          balance: formatValueInGwei(stakeManagerBalance), // Convert to gwei for response
        },
      ]
    } catch (e) {
      throw new Error('Failed to retrieve the StakeManager contract balance')
    }
  }

  // Get inactive pool balance from Stader's StakePoolManager contract
  async getPermissionedPoolBalance(
    req: RequestParams,
    blockTag: number,
  ): Promise<BalanceResponse[]> {
    try {
      const permissionedPool =
        req.permissionedPoolAddress ||
        staderNetworkChainMap[req.network][req.chainId].permissionedPool
      const permissionedPoolBalance = await this.getAddressBalance(permissionedPool, blockTag)
      logger.debug(`Permissioned pool balance (in wei): ${permissionedPoolBalance}`)
      return [
        {
          address: permissionedPool,
          balance: formatValueInGwei(permissionedPoolBalance), // Convert to gwei for response
        },
      ]
    } catch (e) {
      throw new Error('Failed to retrieve the StakeManager contract balance')
    }
  }

  // Get event logs to find deposit events for addresses not on the beacon chain yet
  // Returns deposit amount in wei
  async calculateLimboEthBalances({
    limboAddresses,
    depositedAddresses,
    balances,
    ethDepositContract,
    blockTag,
  }: {
    limboAddresses: string[]
    depositedAddresses: string[]
    balances: BalanceResponse[]
    ethDepositContract: string
    blockTag: number
  }): Promise<void> {
    try {
      const logs = await this.provider.getLogs({
        address: ethDepositContract,
        topics: [DEPOSIT_EVENT_TOPIC],
        fromBlock: blockTag - DEPOSIT_EVENT_LOOKBACK_WINDOW,
        toBlock: blockTag,
      })
      if (logs.length === 0) {
        logger.debug(
          'No deposit event logs found in the last 10,000 blocks or the provider failed to return any.',
        )
        limboAddresses.forEach((address) => balances.push({ address, balance: '0' }))
      } else {
        logger.debug(
          `Found ${logs.length} deposit events in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks`,
        )
        // Parse the logs from latest to oldest to find the relevant events more efficiently
        // assuming we're looking back further than we need to as a precaution
        for (let i = logs.length - 1; i >= 0; i--) {
          const log = logs[i]
          const iface = new ethers.utils.Interface(DepositEvent_ABI)
          const parsedLog = iface.parseLog(log)
          const address = parsedLog.args[0]
          const amount = parseLittleEndian(parsedLog.args[2].toString())
          // Look for initial deposit event for validators not found on the beacon chain
          if (limboAddresses.includes(address)) {
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
      throw new Error(errorMessage)
    }
  }

  // Get balance (in wei) of ETH address
  async getAddressBalance(address: string, blockTag: number): Promise<BigNumber> {
    try {
      return BigNumber((await this.provider.getBalance(address, blockTag)).toString())
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to retrieve address balance for ${address}`
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
      return BigNumber(
        (await addressManager.totalPenaltyAmount(validatorAddress, { blockTag })).toString(),
      )
    } catch (e) {
      logger.error({ error: e })
      const errorMessage = `Failed to retrieve penalty for ${validatorAddress}`
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
        throw new Error(errorMessage)
      }
    }
  }

  // Retrieve validator deposit from Stader contract (32 ETH in wei)
  async getValidatorDeposit(req: RequestParams, blockTag: number): Promise<BigNumber> {
    const staderConfigAddress =
      req.staderConfigAddress || staderNetworkChainMap[req.network][req.chainId].staderConfig
    const addressManager = new ethers.Contract(
      staderConfigAddress,
      StaderConfigContract_ABI,
      this.provider,
    )
    try {
      return BigNumber(String(await addressManager.getStakedEthPerNode({ blockTag })))
    } catch (e) {
      logger.error({ error: e })
      throw new Error(`Failed to retrieve validator deposit amount`)
    }
  }

  // Get the address for the ETH deposit contract
  async getEthDepositContractAddress(settings: typeof config.settings): Promise<string> {
    const url = `/eth/v1/config/deposit_contract`
    const options: AxiosRequestConfig = {
      baseURL: settings.BEACON_RPC_URL,
      url,
    }
    try {
      const response = await axios.request<{ data: { chainId: string; address: string } }>(options)
      logger.debug(`ETH Deposit Contract: ${response.data.data.address}`)
      return response.data.data.address
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
