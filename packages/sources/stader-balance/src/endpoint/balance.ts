import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import axios from 'axios'
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
  fetchAddressBalance,
  fetchEthDepositContractAddress,
  formatValueInGwei,
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
  withErrorHandling,
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

    // Create necessary basic constructs
    const permissionedPool = new PermissionedPool(req, blockTag, this.provider)
    const stakeManager = new StakeManager(req, blockTag, this.provider)
    const staderConfig = new StaderConfig(req, blockTag, this.provider)
    const socialPools = req.socialPoolAddresses.map(
      (a) =>
        new SocialPool({
          ...req,
          ...a,
          blockTag,
          provider: this.provider,
        }),
    )

    // Fetch as much data in parallel as we can
    const [
      ethDepositContractAddress,
      permissionedPoolBalance,
      stakeManagerBalance,
      validatorDeposit,
      validatorList,
      elRewardBalances,
    ] = await Promise.all([
      // Get the address for the main ETH deposit contract
      fetchEthDepositContractAddress(context.adapterSettings),

      // Fetch the balance for the permissioned pool
      permissionedPool.fetchBalance(),

      // Fetch the balance for the stake manager
      stakeManager.fetchBalance(),

      // Fetch the validator deposit value in the stader config
      staderConfig.fetchValidatorDeposit(),

      // Fetch all validators specified in the request addresses from the beacon chain
      Validator.fetchAll(req, context.adapterSettings),

      // Get all the execution layer rewards for the specified addresses in the request
      this.getElRewardBalances(req, blockTag, context.adapterSettings),
    ])

    const params = {
      addresses: req.addresses,
      validatorList,
      req,
      validatorDeposit,
      ethDepositContractAddress,
      blockTag,
      commissionMap,
      collateralEthMap,
    }

    // Perform the final calculations
    const [validatorBalances, poolAddressBalances] = await Promise.all([
      // Perform validator level calculations
      this.performValidatorCalculations(params),

      // Get permissionless/permissioned pool address balances
      Promise.all(socialPools.map((p) => p.fetchBalance(validatorDeposit))),
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

    return withErrorHandling('Retrieving validator execution layer reward balances', async () => {
      for (const group of groupedBatches) {
        await Promise.all(
          group.map(async (address) => {
            const balance = await fetchAddressBalance(address, blockTag, this.provider)
            balances.push({ address, balance: formatValueInGwei(balance) })
          }),
        )
      }

      return balances
    })
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
}

class Validator {
  constructor(private addressData: ValidatorAddress, private state: ValidatorState) {}

  // Retrieve balances from the beacon chain for all validators in request
  static async fetchAll(
    req: RequestParams,
    settings: typeof config.settings,
  ): Promise<Validator[]> {
    return withErrorHandling(
      `Fetching validator states (state id: ${req.stateId}) from the beacon chain`,
      async () => {
        const url = `/eth/v1/beacon/states/${req.stateId}/validators`
        const statusList = req.validatorStatus?.join(',')
        const batchSize = settings.BATCH_SIZE
        const addresses = req.addresses
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
        const groupedBatches = chunkArray(batchedAddresses, settings.GROUP_SIZE)
        for (const group of groupedBatches) {
          await Promise.all(
            group.map(async (address) => {
              const response = await axios.request<ProviderResponse>({
                baseURL: settings.BEACON_RPC_URL,
                url,
                params: { id: address, status: statusList },
              })

              for (const state of response.data.data) {
                validators.push(new Validator(addressMap[state.validator.pubkey], state))
              }
            }),
          )
        }

        // Get the validator states from the responses, flatten the groups and return
        return validators
      },
    )
  }
}

class StaderConfig {
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

  async fetchValidatorDeposit() {
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

class StakeManager {
  address: string
  balance?: BalanceResponse

  constructor(
    req: { stakeManagerAddress?: string; network: string; chainId: string },
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {
    this.address =
      req.stakeManagerAddress || staderNetworkChainMap[req.network][req.chainId].stakePoolsManager
  }

  // Get inactive pool balance from Stader's StakePoolManager contract
  async fetchBalance() {
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

class PermissionedPool {
  address: string
  balance?: BalanceResponse

  constructor(
    req: { permissionedPoolAddress?: string; network: string; chainId: string },
    private blockTag: number,
    private provider: ethers.providers.JsonRpcProvider,
  ) {
    this.address =
      req.permissionedPoolAddress ||
      staderNetworkChainMap[req.network][req.chainId].permissionedPool
  }

  // TODO: the comment below is probably innacurate
  // Get inactive pool balance from Stader's StakePoolManager contract
  async fetchBalance() {
    if (!this.balance) {
      const balance = await withErrorHandling(`Fetching permissioned pool balance`, async () =>
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

class SocialPool {
  collateralEth?: BigNumber
  // operatorFeePercentage?: number
  // protocolFeePercentage?: number
  // totalCommissionPercentage?: number
  addressBalance?: number

  private id: number
  private address: string
  private blockTag: number
  private provider: ethers.providers.JsonRpcProvider
  private poolFactoryManager: ethers.Contract

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

    const contractAddress =
      params.poolFactoryAddress || staderNetworkChainMap[params.network][params.chainId].poolFactory
    this.poolFactoryManager = new ethers.Contract(
      contractAddress,
      StaderPoolFactoryContract_ABI,
      params.provider,
    )
  }

  async fetchBalance(validatorDeposit: BigNumber) {
    // Fetch data
    // TODO: This could be pre-fetched
    const addressBalance = await this.fetchAddressBalance()
    const commission = await this.fetchTotalCommissionPercentage()
    const collateralEth = await this.fetchCollateralEth()

    // Calculate the balance
    const userDeposit = validatorDeposit.minus(collateralEth)
    const balance = addressBalance.times(userDeposit.div(validatorDeposit)).times(1 - commission)

    logger.debug(`[Pool ${this.id}] calculated balance (in wei): ${balance}`)
    return {
      address: this.address,
      balance: formatValueInGwei(balance), // Convert to gwei for response
    }
  }

  async fetchAddressBalance() {
    return withErrorHandling(`[Pool ${this.id}] Fetching address balance`, async () =>
      fetchAddressBalance(this.address, this.blockTag, this.provider),
    )
  }

  // Retrieve the pool's collateral ETH from the Stader Pool Factory contract
  async fetchCollateralEth() {
    return withErrorHandling(`[Pool ${this.id}] Fetching collateral ETH`, async () =>
      BigNumber(
        String(
          await this.poolFactoryManager.getCollateralETH(this.id, { blockTag: this.blockTag }),
        ),
      ),
    )
  }

  async fetchTotalCommissionPercentage() {
    return withErrorHandling(`[Pool ${this.id}] Fetching and calculating all data`, async () => {
      // Get the fee percentages from the pool manager contract
      const [operatorFeePercentage, protocolFeePercentage] = await Promise.all([
        this.fetchOperatorFeePercentage(),
        this.fetchProtocolFeePercentage(),
      ])

      // Calculate the total commission
      return operatorFeePercentage + protocolFeePercentage
    })
  }

  // Retrieve the pool's operator fee from the Stader Pool Factory contract and calculate the percentage
  async fetchOperatorFeePercentage() {
    return withErrorHandling(
      `[Pool ${this.id}] Fetching operator fee percentage`,
      async () =>
        // Format in BIPS: 0-10000
        (await this.poolFactoryManager.getOperatorFee(this.id, { blockTag: this.blockTag })) /
        10000,
    )
  }

  // Get protocol fee percentage from Stader Pool Factory Contract, used to calculate commission
  async fetchProtocolFeePercentage() {
    return withErrorHandling(
      `[Pool ${this.id}] Fetching protocol fee percentage`,
      async () =>
        // Format in BIPS: 0-10000
        (await this.poolFactoryManager.getProtocolFee(this.id, { blockTag: this.blockTag })) /
        10000,
    )
  }
}

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
