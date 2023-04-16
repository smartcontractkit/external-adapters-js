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
  PoolAddress,
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
    const { socialPools, socialPoolMap } = SocialPool.buildAll(req, blockTag, this.provider)

    // Fetch as much data in parallel as we can
    const [
      ethDepositContractAddress,
      permissionedPoolBalance,
      stakeManagerBalance,
      validatorDeposit,
      { validators, limboAddresses, depositedAddresses },
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
      Validator.fetchAll({
        ...req,
        socialPoolMap,
        blockTag,
        penaltyContract: this.buildPenaltyContract(req),
        settings: context.adapterSettings,
        provider: this.provider,
      }),

      // Get all the execution layer rewards for the specified addresses in the request
      this.getElRewardBalances(req, blockTag, context.adapterSettings),
    ])

    // Perform the final calculations
    const [validatorBalances, poolAddressBalances] = await Promise.all([
      // Perform validator level calculations
      Promise.all(validators.map((v) => v.calculateBalance(validatorDeposit))),

      // Get permissionless/permissioned pool address balances
      Promise.all(socialPools.map((p) => p.fetchBalance(validatorDeposit))),

      // Get balances for all validator addresses in limbo and deposited addresses
      this.calculateLimboEthBalances({
        limboAddresses,
        depositedAddresses,
        ethDepositContractAddress,
        blockTag,
      }),
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

  private buildPenaltyContract(params: {
    penaltyAddress?: string
    network: string
    chainId: string
  }) {
    const penaltyAddress =
      params.penaltyAddress || staderNetworkChainMap[params.network][params.chainId].penalty
    return new ethers.Contract(penaltyAddress, StaderPenaltyContract_ABI, this.provider)
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
    ethDepositContractAddress,
    blockTag,
  }: {
    limboAddresses: string[]
    depositedAddresses: string[]
    ethDepositContractAddress: string
    blockTag: number
  }): Promise<BalanceResponse[]> {
    return withErrorHandling(
      `Finding ETH for limbo validators and deposited addresses`,
      async () => {
        // Get all the deposit logs from the last DEPOSIT_EVENT_LOOKBACK_WINDOW blocks
        const logs = await this.provider.getLogs({
          address: ethDepositContractAddress,
          topics: [DEPOSIT_EVENT_TOPIC],
          fromBlock: blockTag - DEPOSIT_EVENT_LOOKBACK_WINDOW,
          toBlock: blockTag,
        })

        if (logs.length === 0) {
          logger.debug(
            'No deposit event logs found in the last 10,000 blocks or the provider failed to return any.',
          )
          // TODO: Should we return this (an entry with balance 0) or just skip it?
          return limboAddresses.map((address) => ({ address, balance: '0' }))
        }

        // Build a map of deposits that will be filled with all deposits in the last 10k logs
        const depositMap: Record<
          string,
          {
            singleEthDepositsTotal: BigNumber
            otherDepositsTotal: BigNumber
          }
        > = {}
        logger.debug(
          `Found ${logs.length} deposit events in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks`,
        )

        // TODO: I think the line below alludes to the fact that once you reach 32ETH we wouldn't need to keep
        //       looking in the logs, but this break is not actually implemented
        //       I'm rewriting it to be simpler

        // Parse the fetched logs with the deposit event interface
        const depositEventInterface = new ethers.utils.Interface(DepositEvent_ABI)
        const parsedlogs = logs
          .map((l) => depositEventInterface.parseLog(l))
          .map((l) => ({
            address: l.args[0],
            amount: parseLittleEndian(l.args[2].toString()),
          }))

        // Build a map of all deposits
        for (const { address, amount } of parsedlogs) {
          if (!depositMap[address]) {
            depositMap[address] = {
              singleEthDepositsTotal: new BigNumber(0),
              otherDepositsTotal: new BigNumber(0),
            }
          }

          // We separate the single ETH deposits to avoid potential double counting for deposited addresses
          // with the validator balance we got from the beacon chain
          if (amount.eq(ONE_ETH_WEI)) {
            depositMap[address].singleEthDepositsTotal =
              depositMap[address].singleEthDepositsTotal.plus(amount)
          } else {
            depositMap[address].otherDepositsTotal =
              depositMap[address].otherDepositsTotal.plus(amount)
          }
        }

        // TODO: Should we return this (an entry with balance 0) or just skip it?
        // Build final balances using the parsed logs
        const limboBalances = limboAddresses.map((address) => ({
          address,
          balance: depositMap[address]
            ? formatValueInGwei(
                depositMap[address].otherDepositsTotal.plus(
                  depositMap[address].singleEthDepositsTotal,
                ),
              )
            : '0',
        }))
        const depositedBalances = depositedAddresses.map((address) => ({
          address,
          balance: depositMap[address]
            ? formatValueInGwei(depositMap[address].otherDepositsTotal)
            : '0',
        }))

        return limboBalances.concat(depositedBalances)
      },
    )
  }
}

class Validator {
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

  isDeposited() {
    // TODO: Check if this is accurate, I think it might be wrong
    return (
      this.state.status === StaderValidatorStatus.DEPOSITED.toString() &&
      this.validatorBalance.eq(ONE_ETH_WEI)
    )
  }

  async fetchWithdrawalAddressBalance() {
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

        // TODO: should validators that are added to this depositedAddresses list go through the other balance calc?
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

  async fetchBalance(validatorDeposit: BigNumber) {
    // Fetch data
    // TODO: This could be pre-fetched
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

  async fetchAddressBalance() {
    return withErrorHandling(`${this.logPrefix} Fetching address balance`, async () =>
      fetchAddressBalance(this.address, this.blockTag, this.provider),
    )
  }

  // Retrieve the pool's collateral ETH from the Stader Pool Factory contract
  async fetchCollateralEth() {
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

  async fetchTotalCommissionPercentage() {
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
  async fetchOperatorFeePercentage() {
    return withErrorHandling(
      `${this.logPrefix} Fetching operator fee percentage`,
      async () =>
        // Format in BIPS: 0-10000
        (await this.poolFactoryManager.getOperatorFee(this.id, { blockTag: this.blockTag })) /
        10000,
    )
  }

  // Get protocol fee percentage from Stader Pool Factory Contract, used to calculate commission
  async fetchProtocolFeePercentage() {
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
  ) {
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

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
