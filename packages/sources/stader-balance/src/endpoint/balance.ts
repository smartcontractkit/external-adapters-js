import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { DepositEvent_ABI, StaderPenaltyContract_ABI } from '../abi/StaderContractAbis'
import { config } from '../config'
import { PermissionedPool } from '../model/permissioned-pool'
import { Pool } from '../model/pool'
import { StaderConfig } from '../model/stader-config'
import { StakeManager } from '../model/stake-manager'
import { ValidatorFactory } from '../model/validator'
import {
  BalanceResponse,
  DEPOSIT_EVENT_LOOKBACK_WINDOW,
  DEPOSIT_EVENT_TOPIC,
  EndpointTypes,
  ONE_ETH_WEI,
  RequestParams,
  THIRTY_ONE_ETH_WEI,
  ValidatorAddress,
  chunkArray,
  fetchAddressBalance,
  fetchEthDepositContractAddress,
  formatValueInGwei,
  getBeaconGenesisTimestamp,
  inputParameters,
  parseLittleEndian,
  withErrorHandling,
} from './utils'

const logger = makeLogger('StaderBalanceLogger')
export class BalanceTransport extends SubscriptionTransport<EndpointTypes> {
  provider!: ethers.providers.JsonRpcProvider
  genesisTimestampInSec!: Promise<number>

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
    this.genesisTimestampInSec = getBeaconGenesisTimestamp(adapterSettings.BEACON_RPC_URL)
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
    const latestBlockNum = await this.provider.getBlockNumber() // 1X
    const blockTag = latestBlockNum - req.confirmations

    // Fetch addresses for all relevant contracts from the StaderConfig contract
    // Override with addresses from request, if exist
    const staderConfig = new StaderConfig(req, blockTag, this.provider)
    const { poolFactoryAddress, penaltyAddress, stakeManagerAddress, permissionedPoolAddress } =
      await staderConfig.fetchContractAddresses(req, blockTag)

    // Create necessary basic constructs
    const permissionedPool = new PermissionedPool(permissionedPoolAddress, blockTag, this.provider)
    const stakeManager = new StakeManager(stakeManagerAddress, blockTag, this.provider)
    const { socialPools, poolMap } = await Pool.buildAll(
      { ...req, poolFactoryAddress },
      blockTag,
      this.provider,
    )

    // Fetch as much data in parallel as we can
    // Max concurrent calls = (batched validator states * settings.GROUP_SIZE) + (EL reward address balance * $batchSize) + 4 single reqs
    const [
      ethDepositContractAddress,
      permissionedPoolBalance,
      stakeManagerBalance,
      validatorDeposit,
      elRewardBalances,
      { activeValidators, withdrawnValidators, limboAddressMap, depositedAddressMap },
    ] = await Promise.all([
      // --- Requests to the execution node ---

      // Get the address for the main ETH deposit contract
      fetchEthDepositContractAddress(context.adapterSettings), // 1X

      // Fetch the balance for the permissioned pool
      permissionedPool.fetchBalance(), // 1X

      // Fetch the balance for the stake manager
      stakeManager.fetchBalance(), // 1X

      // Fetch the validator deposit value in the stader config
      staderConfig.fetchValidatorDeposit(), // 1X

      // Get all the execution layer rewards for the specified addresses in the request
      this.getElRewardBalances(req, blockTag, context.adapterSettings), // 1X per elRewardAddresses, sent in parallel bursts of $batchSize

      // --- Requests to the Beacon node ---

      // Fetch all validators specified in the request addresses from the beacon chain
      ValidatorFactory.fetchAll({
        ...req,
        poolMap,
        blockTag,
        penaltyContract: this.buildPenaltyContract(penaltyAddress),
        settings: context.adapterSettings,
        provider: this.provider,
        genesisTimestampInSec: await this.genesisTimestampInSec,
      }),
    ])

    // Get permissionless/permissioned pool address balances
    // This will also cache values in the pools that the validators will be able to reuse
    // Should not be a problem to send all requests concurrently, as the # of pools should be in the low 10s
    const poolAddressBalances = await Promise.all(
      socialPools.map((p) => p.fetchBalance(validatorDeposit)),
    )

    // Get balances for all validator addresses in limbo and deposited addresses
    const { limboBalances, depositedBalanceMap } = await this.calculateLimboEthBalances({
      limboAddressMap,
      depositedAddressMap,
      ethDepositContractAddress,
      blockTag,
    })

    // Perform withdrawn validator calculations
    // These we can do all at once, since they shouldn't cause any requests to the ETH node
    const validatorBalances = await Promise.all(
      withdrawnValidators.map((v) => v.calculateBalance(validatorDeposit)),
    )

    // Perform active validator calculations
    // These will need a call to get the penalty rate for each of them, so we have to batch these
    const batches = chunkArray(activeValidators, context.adapterSettings.GROUP_SIZE)
    for (const batch of batches) {
      validatorBalances.push(
        ...(await Promise.all(
          batch.map((v) =>
            v.calculateBalance(validatorDeposit, depositedBalanceMap[v.addressData.address]),
          ),
        )),
      )
    }

    // Flatten all the balances out, they'll be aggregated in the proof-of-reserves EA
    const balances = [
      stakeManagerBalance,
      elRewardBalances,
      permissionedPoolBalance,
      validatorBalances,
      poolAddressBalances,
      limboBalances,
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

  private buildPenaltyContract(penaltyAddress: string) {
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
    limboAddressMap = {},
    depositedAddressMap = {},
    ethDepositContractAddress,
    blockTag,
  }: {
    limboAddressMap: Record<string, ValidatorAddress>
    depositedAddressMap: Record<string, ValidatorAddress>
    ethDepositContractAddress: string
    blockTag: number
  }): Promise<{
    limboBalances: BalanceResponse[]
    depositedBalanceMap: Record<string, BigNumber>
  }> {
    return withErrorHandling(
      `Finding ETH for limbo validators and deposited addresses`,
      async () => {
        let limboBalances: BalanceResponse[] = []
        const depositedBalanceMap: Record<string, BigNumber> = {}

        // Skip fetching logs if no addresses in limbo to search for
        if (
          Object.entries(limboAddressMap).length === 0 &&
          Object.entries(depositedAddressMap).length === 0
        ) {
          return { limboBalances, depositedBalanceMap }
        }

        // Get all the deposit logs from the last DEPOSIT_EVENT_LOOKBACK_WINDOW blocks
        const logs = await this.provider.getLogs({
          address: ethDepositContractAddress,
          topics: [DEPOSIT_EVENT_TOPIC],
          fromBlock: blockTag - DEPOSIT_EVENT_LOOKBACK_WINDOW,
          toBlock: blockTag,
        })

        if (logs.length === 0) {
          logger.debug(
            `No deposit event logs found in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks or the provider failed to return any.`,
          )
          // We're returning this so the EA has an explicit answer for the address balance
          limboBalances = Object.entries(limboAddressMap).map(([address, _]) => ({
            address,
            balance: '0',
          }))
          return { limboBalances, depositedBalanceMap }
        }

        logger.debug(
          `Found ${logs.length} deposit events in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks`,
        )

        // Parse the fetched logs with the deposit event interface
        const depositEventInterface = new ethers.utils.Interface(DepositEvent_ABI)
        const parsedlogs = logs
          .map((l) => depositEventInterface.parseLog(l))
          .map((l) => ({
            address: l.args[0],
            amount: parseLittleEndian(l.args[2].toString()),
          }))

        for (const { address, amount } of parsedlogs) {
          // Limbo addresses are ones where the first 1 eth was sent from Stader but has not reached the beacon chain yet
          if (limboAddressMap[address]) {
            if (amount.eq(ONE_ETH_WEI)) {
              logger.debug(`Found 1 ETH deposit event for validator ${address}`)
              limboBalances.push({
                address,
                balance: formatValueInGwei(amount),
              })
            } else {
              logger.warn(
                `Unexpected balance amount ${amount} (in wei) found for limbo address ${address}, expected ${ONE_ETH_WEI}`,
              )
            }
          }
          // Deposited addresses are ones where the first eth has reached the beacon chain, but the second 31eth deposit hasn't
          if (depositedAddressMap[address]) {
            if (amount.eq(THIRTY_ONE_ETH_WEI)) {
              logger.debug(`Found 31 ETH deposit event for deposited validator ${address}`)
              depositedBalanceMap[address] = amount
            } else if (amount.eq(ONE_ETH_WEI)) {
              logger.debug(
                `Found initial 1 ETH deposit for address ${address}, but it should already be accounted in the main validators list`,
              )
            } else {
              logger.warn(
                `Unexpected balance amount ${amount} (in wei) found for deposited address ${address}, expected ${THIRTY_ONE_ETH_WEI}`,
              )
            }
          }
        }

        return { limboBalances, depositedBalanceMap }
      },
    )
  }
}

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
