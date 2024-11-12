import { config } from '../config'
import {
  StaderConfigContract_ABI,
  StaderNodeRegistryContract_ABI,
  StaderOracle_ABI,
  StaderPermissionlessNodeRegistryContract_ABI,
  StaderPoolFactoryContract_ABI,
} from '../config/StaderContractAbis'
import { ethers } from 'ethers'
import {
  filterDuplicateAddresses,
  NetworkChainMap,
  runAllSequentially,
  ValidatorRegistryResponse,
} from './utils'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  BaseEndpointTypes,
  BasicAddress,
  inputParameters,
  PoolAddress,
  ValidatorAddress,
} from '../endpoint/address'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('StaderAddressList')

type RequestParams = typeof inputParameters.validated

const staderNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: {
      staderConfig: '',
    },
    goerli: {
      staderConfig: '0x198C5bC65acce5a35Ae7A8B7AEf4f92FA94C1c6E',
    },
  },
}

export class AddressTransport extends SubscriptionTransport<BaseEndpointTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: typeof config.settings,
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.RPC_URL,
      adapterSettings.CHAIN_ID,
    )
  }

  getSubscriptionTtlFromConfig(adapterSettings: typeof config.settings): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    await Promise.all(entries.map(async (req) => this.handleRequest(req)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  buildStaderConfigContract(req: RequestParams): ethers.Contract {
    const staderConfigAddress =
      req.staderConfigAddress || staderNetworkChainMap[req.network][req.chainId].staderConfig
    return new ethers.Contract(staderConfigAddress, StaderConfigContract_ABI, this.provider)
  }

  buildFactoryManagerContract(poolFactoryAddress: string): ethers.Contract {
    return new ethers.Contract(poolFactoryAddress, StaderPoolFactoryContract_ABI, this.provider)
  }

  buildNodeRegistryManagerContract(nodeRegistryAddress: string): ethers.Contract {
    return new ethers.Contract(nodeRegistryAddress, StaderNodeRegistryContract_ABI, this.provider)
  }

  buildStaderOracleManagerContract(staderOracleAddress: string): ethers.Contract {
    return new ethers.Contract(staderOracleAddress, StaderOracle_ABI, this.provider)
  }

  buildPermissionlessNodeRegistryManagerContract(
    permissionlessNodeRegistry: string,
  ): ethers.Contract {
    return new ethers.Contract(
      permissionlessNodeRegistry,
      StaderPermissionlessNodeRegistryContract_ABI,
      this.provider,
    )
  }

  async handleRequest(req: RequestParams): Promise<void> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(req)
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
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const {
      confirmations,
      poolFactoryAddress: poolFactoryAddressOverride,
      stakeManagerAddress,
      chainId,
      network,
      validatorStatus,
      batchSize,
      penaltyAddress,
      permissionedPoolAddress,
      staderConfigAddress: staderConfigAddressOverride,
    } = req

    // Get data for the latest block in the chain
    const latestBlockNum = await this.provider.getBlockNumber()
    const currentBlock = latestBlockNum - confirmations

    const staderConfigManager = this.buildStaderConfigContract(req)

    const staderOracleAddress = await this.fetchStaderOracleAddress(
      req,
      staderConfigManager,
      currentBlock,
    )

    const staderOracleManager = this.buildStaderOracleManagerContract(staderOracleAddress)
    const reportedBlock = Number(
      await staderOracleManager.getERReportableBlock({
        blockTag: currentBlock,
      }),
    )

    logger.debug(`Reported block number retrieved from Stader Oracle: ${reportedBlock}`)

    // Fetch contract addresses using overrides from the request with defaults from the StaderConfig contract as fallbacks
    const { poolFactoryAddress, permissionlessNodeRegistry } = await this.fetchContractAddresses(
      req,
      staderConfigManager,
      reportedBlock,
    )

    // Return error if reported block number within sync window
    // Stader wants to sync the block number that both the balance and totalSupply feed report for
    // Setting this window helps ensure the reported block didn't change between the two feeds reporting
    if (reportedBlock >= currentBlock - req.syncWindow) {
      const errorMessage = `Reported block number ${reportedBlock} within ${req.syncWindow} blocks of current block ${currentBlock}. At risk of being out of sync with total supply feed.`
      logger.error(errorMessage)
      return {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    // Build the necessary contracts using the calculated addresses
    const poolFactoryManager = this.buildFactoryManagerContract(poolFactoryAddress)
    const permissionlessNodeRegistryManager = this.buildPermissionlessNodeRegistryManagerContract(
      permissionlessNodeRegistry,
    )

    // We're making a lot of requests in this complex logic, so we start counting the time
    // it takes for the provider to reply from here, accounting for all requests involved
    const providerDataRequestedUnixMs = Date.now()

    // Get the number of pools in the pool manager
    const poolIdArray: number[] = await poolFactoryManager.getPoolIdArray({
      blockTag: reportedBlock,
    })
    logger.debug(`Number of pools in pool factory manager: ${poolIdArray.length}`)

    const params = {
      provider: this.provider,
      blockTag: reportedBlock,
      network,
      chainId,
      batchSize,
      poolIdArray,
    }

    // Fetch all addresses, parallelizing requests as much as possible
    // All of these addresses will be necessary to calculate balances
    const [addressList, socialPoolAddresses, elRewardAddresses] = await Promise.all([
      this.fetchValidatorAddresses({ ...params, poolFactoryManager }),
      this.fetchSocializingPoolAddresses({ ...params, poolFactoryManager }),
      this.fetchElRewardAddresses({ ...params, permissionlessNodeRegistryManager }),
    ])

    // Build response
    return {
      data: {
        stakeManagerAddress,
        poolFactoryAddress: poolFactoryAddressOverride,
        penaltyAddress,
        permissionedPoolAddress,
        staderConfigAddress: staderConfigAddressOverride,
        validatorStatus,
        socialPoolAddresses,
        elRewardAddresses,
        confirmations,
        network,
        chainId,
        reportedBlock,
        result: addressList,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  // Fetches all the validator addresses for a specific pool
  async fetchPoolValidatorAddresses(params: {
    poolFactoryManager: ethers.Contract
    blockTag: number
    network: string
    chainId: string
    poolId: number
    batchSize: number
  }): Promise<ValidatorAddress[]> {
    // Get the address for the pool's node registry from the pool factory manager
    const nodeRegistryAddress: string = await params.poolFactoryManager.getNodeRegistry(
      params.poolId,
      {
        blockTag: params.blockTag,
      },
    )
    const nodeRegistryManager = this.buildNodeRegistryManagerContract(nodeRegistryAddress)

    // Fetch the number of validators in the pool's node registry
    const validatorCount =
      (await nodeRegistryManager.nextValidatorId({ blockTag: params.blockTag })) - 1
    logger.debug(
      `${validatorCount} addresses in pool ${params.poolId}. Not all of them may be active.`,
    )

    // Get all validator addresses in batches
    const validators = await runAllSequentially({
      count: validatorCount / params.batchSize,
      handler: (index) => {
        // Pages are 1 indexed in the contracts so adding 1 to the index to iterate over the proper range
        const pageNumber = index + 1
        return nodeRegistryManager.getAllActiveValidators(pageNumber, params.batchSize, {
          blockTag: params.blockTag,
        }) as Promise<ValidatorRegistryResponse[]>
      },
    })

    // Map the node registry response to the validator address list format
    return validators.flat().map(([status, pubkey, , , withdrawVaultAddress, operatorId, , ,]) => ({
      address: pubkey,
      withdrawVaultAddress,
      network: params.network,
      chainId: params.chainId,
      operatorId: Number(operatorId),
      poolId: params.poolId,
      status,
    }))
  }

  // Fetch validator addresses and their metadata for all pools
  async fetchValidatorAddresses(params: {
    poolFactoryManager: ethers.Contract
    blockTag: number
    network: string
    chainId: string
    batchSize: number
    poolIdArray: number[]
  }): Promise<ValidatorAddress[]> {
    logger.debug('Fetching validator address list')

    try {
      // Get all the validator addresses for each pool
      const addresses = await runAllSequentially({
        count: params.poolIdArray.length,
        handler: (index) => {
          const poolId = params.poolIdArray[index]
          return this.fetchPoolValidatorAddresses({ ...params, poolId })
        },
      })

      // Flatten the addresses out, remove duplicates, and return
      return filterDuplicateAddresses(addresses.flat())
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve validator addresses from contract')
    }
  }

  // Fetch socializing pool addresses
  async fetchSocializingPoolAddresses(params: {
    poolFactoryManager: ethers.Contract
    blockTag: number
    poolIdArray: number[]
  }): Promise<PoolAddress[]> {
    logger.debug('Fetching socializing pool address list')

    try {
      // Get the socializing address for each pool
      const addresses = await runAllSequentially({
        count: params.poolIdArray.length,
        handler: async (index) => {
          const poolId = params.poolIdArray[index]
          const address: string = await params.poolFactoryManager.getSocializingPoolAddress(
            poolId,
            {
              blockTag: params.blockTag,
            },
          )
          return { address, poolId }
        },
      })

      // Remove duplicates and return
      return filterDuplicateAddresses(addresses)
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve socializing pool addresses from contract')
    }
  }

  // Fetch node EL reward addresses from mapping in the Permissionless Node Registry
  async fetchElRewardAddresses(params: {
    permissionlessNodeRegistryManager: ethers.Contract
    blockTag: number
    batchSize: number
  }): Promise<BasicAddress[]> {
    logger.debug('Fetching node EL reward address list')

    try {
      const operatorCount =
        (await params.permissionlessNodeRegistryManager.nextOperatorId({
          blockTag: params.blockTag,
        })) - 1
      logger.debug(`${operatorCount} operators found in permissionless node registry`)
      // Pages are 1 indexed in the contracts so adding 1 to the total pages and index to iterate over the proper range
      const addresses = await runAllSequentially({
        count: operatorCount / params.batchSize,
        handler: async (index) => {
          const pageNumber = index + 1
          const addresses: string[] =
            await params.permissionlessNodeRegistryManager.getAllNodeELVaultAddress(
              pageNumber,
              params.batchSize,
              {
                blockTag: params.blockTag,
              },
            )
          return addresses.map((address) => ({ address }))
        },
      })

      // Flatten the addresses out, remove duplicates, and return
      return filterDuplicateAddresses(addresses.flat())
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve node EL reward addresses from contract')
    }
  }

  async fetchStaderOracleAddress(
    req: RequestParams,
    staderConfigManager: ethers.Contract,
    blockTag: number,
  ): Promise<string> {
    const staderOracleAddressDefault = await staderConfigManager.getStaderOracle({ blockTag })
    const staderOracleAddress = req.staderOracleAddress || staderOracleAddressDefault
    return staderOracleAddress
  }

  async fetchContractAddresses(
    req: RequestParams,
    staderConfigManager: ethers.Contract,
    blockTag: number,
  ): Promise<{
    poolFactoryAddress: string
    permissionlessNodeRegistry: string
  }> {
    const [poolFactoryAddressDefault, permissionlessNodeRegistryDefault] = await Promise.all([
      staderConfigManager.getPoolUtils({ blockTag }),
      staderConfigManager.getPermissionlessNodeRegistry({ blockTag }),
    ])

    logger.debug(
      `Addresses found on the StaderConfig contract. Pool Factory: ${poolFactoryAddressDefault}. Permissionless Node Registry: ${permissionlessNodeRegistryDefault}`,
    )

    // Override address found on StaderConfig contract with ones sent in the request
    const poolFactoryAddress = req.poolFactoryAddress || poolFactoryAddressDefault
    const permissionlessNodeRegistry =
      req.permissionlessNodeRegistry || permissionlessNodeRegistryDefault

    return { poolFactoryAddress, permissionlessNodeRegistry }
  }
}

export const transport = new AddressTransport()
