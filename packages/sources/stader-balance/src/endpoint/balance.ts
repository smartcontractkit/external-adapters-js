import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { DepositEvent_ABI, StaderPenaltyContract_ABI } from '../abi/StaderContractAbis'
import { config } from '../config'
import { PermissionedPool } from '../model/permissioned-pool'
import { SocialPool } from '../model/social-pool'
import { StaderConfig } from '../model/stader-config'
import { StakeManager } from '../model/stake-manager'
import { Validator } from '../model/validator'
import {
  BalanceResponse,
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
  RequestParams,
  staderNetworkChainMap,
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

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
