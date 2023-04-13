import { AdapterEndpoint, EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterResponse,
  makeLogger,
  sleep,
  TimestampedProviderErrorResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { ethers } from 'ethers'
import {
  StaderPoolFactoryContract_ABI,
  StaderPermissionlessNodeRegistryContract_ABI,
} from '../abi/StaderContractAbis'
import { config } from '../config'
import {
  BasicAddress,
  buildErrorResponse,
  EndpointTypes,
  fetchElRewardAddressesByPage,
  fetchSocialPoolAddressesByPool,
  fetchValidatorsByPool,
  filterDuplicates,
  FunctionParameters,
  NetworkChainMap,
  parsePages,
  parsePools,
  PoolAddress,
  RequestParams,
  ValidatorAddress,
} from '../utils'

const logger = makeLogger('StaderAddressList')

const networks = ['ethereum']
const chainIds = ['mainnet', 'goerli']

const staderNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: {
      poolFactory: '',
      permissionlessNodeRegistry: '',
    },
    goerli: {
      poolFactory: '0x019a7ced1927946eADb28735f15a20e3ed762240',
      permissionlessNodeRegistry: '0x2f454143D26fB4E3C351c65B839AF8A64a1Fa1ea',
    },
  },
}

const inputParameters = {
  poolFactoryAddress: {
    description: 'The address of the Stader PoolFactory contract.',
    type: 'string',
  },
  permissionlessNodeRegistry: {
    description: 'The address of the Stader Permissionless Node Registry contract.',
    type: 'string',
  },
  stakeManagerAddress: {
    description: 'The address of the Stader StakeManager contract.',
    type: 'string',
  },
  penaltyAddress: {
    description: 'The address of the Stader Penalty contract.',
    type: 'string',
  },
  permissionedPoolAddress: {
    description: 'The address of the Stader Permissioned Pool.',
    type: 'string',
  },
  staderConfigAddress: {
    description: 'The address of the Stader Config contract.',
    type: 'string',
  },
  confirmations: {
    type: 'number',
    description: 'The number of confirmations to query data from',
    default: 0,
  },
  chainId: {
    description: 'The name of the target custodial chain',
    options: chainIds,
    type: 'string',
    default: 'mainnet',
  },
  network: {
    description: 'The name of the target custodial network protocol',
    options: networks,
    type: 'string',
    default: 'ethereum',
  },
  validatorStatus: {
    required: false,
    type: 'array',
    description: 'A filter to apply validators by their status',
  },
  batchSize: {
    description: 'The number of addresses to fetch from the contract at a time',
    default: 10,
  },
} satisfies InputParameters

export class AddressTransport extends SubscriptionTransport<EndpointTypes> {
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
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
    context: EndpointContext<EndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (!entries.length) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
      return
    }
    await Promise.all(entries.map(async (req) => this.handleRequest(req)))
  }

  async handleRequest(req: RequestParams): Promise<void> {
    const {
      confirmations,
      poolFactoryAddress: poolFactoryAddressOverride,
      permissionlessNodeRegistry: permissionlessNodeRegistryOverride,
      stakeManagerAddress,
      chainId,
      network,
      validatorStatus,
      batchSize,
      penaltyAddress,
      permissionedPoolAddress,
      staderConfigAddress,
    } = req
    const poolFactoryAddress =
      poolFactoryAddressOverride || staderNetworkChainMap[network][chainId].poolFactory
    const permissionlessNodeRegistry =
      permissionlessNodeRegistryOverride ||
      staderNetworkChainMap[network][chainId].permissionlessNodeRegistry
    const poolFactoryManager = new ethers.Contract(
      poolFactoryAddress,
      StaderPoolFactoryContract_ABI,
      this.provider,
    )
    const permissionlessNodeRegistryManager = new ethers.Contract(
      permissionlessNodeRegistry,
      StaderPermissionlessNodeRegistryContract_ABI,
      this.provider,
    )
    const providerDataRequestedUnixMs = Date.now()
    let response: AdapterResponse<EndpointTypes['Response']>
    try {
      const latestBlockNum = await this.provider.getBlockNumber()
      const blockTag = latestBlockNum - confirmations
      const poolCount = await poolFactoryManager.poolCount({ blockTag })
      logger.debug(`Pool Count: ${poolCount}`)
      const params = {
        provider: this.provider,
        blockTag,
        network,
        chainId,
        batchSize,
        poolCount,
      }
      const [addressList, socialPoolAddresses, elRewardAddresses] = await Promise.all([
        this.fetchValidatorAddressList({ ...params, manager: poolFactoryManager }),
        this.fetchSocializingPoolAddresses({ ...params, manager: poolFactoryManager }),
        this.fetchElRewardAddresses({ ...params, manager: permissionlessNodeRegistryManager }),
      ])

      // Build response
      response = {
        data: {
          stakeManagerAddress,
          poolFactoryAddress: poolFactoryAddressOverride,
          penaltyAddress,
          permissionedPoolAddress,
          staderConfigAddress,
          validatorStatus,
          socialPoolAddresses,
          elRewardAddresses,
          confirmations,
          network,
          chainId,
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
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      response = this.handleErrorResponse(errorMessage)
    }

    await this.responseCache.write(this.name, [{ params: req, response }])
  }

  // Fetch validator addresses and their metadata
  async fetchValidatorAddressList(params: FunctionParameters): Promise<ValidatorAddress[]> {
    try {
      logger.debug('Fetching validator address list')
      let addresses = await parsePools<ValidatorAddress>(params, fetchValidatorsByPool)
      addresses = filterDuplicates<ValidatorAddress>(addresses)
      return addresses
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve validator addresses from contract')
    }
  }

  // Fetch socializing pool addresses
  async fetchSocializingPoolAddresses(params: FunctionParameters): Promise<PoolAddress[]> {
    try {
      logger.debug('Fetching socializing pool address list')
      let socialPoolAddresses = await parsePools<PoolAddress>(
        params,
        fetchSocialPoolAddressesByPool,
      )
      socialPoolAddresses = filterDuplicates<PoolAddress>(socialPoolAddresses)
      return socialPoolAddresses
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve socializing pool addresses from contract')
    }
  }

  // Fetch node EL reward addresses from mapping in the Permissionless Node Registry
  async fetchElRewardAddresses(params: FunctionParameters): Promise<BasicAddress[]> {
    try {
      logger.debug('Fetching node EL reward address list')
      let elRewardAddresses: BasicAddress[] = []
      const operatorCount = (await params.manager.nextOperatorId({ blockTag: params.blockTag })) - 1
      logger.debug(`${operatorCount} operators found in permissionless node registry`)
      elRewardAddresses = await parsePages(
        { ...params, count: operatorCount, poolId: 0 },
        fetchElRewardAddressesByPage,
      )

      elRewardAddresses = filterDuplicates<BasicAddress>(elRewardAddresses)
      return elRewardAddresses
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve node EL reward addresses from contract')
    }
  }

  handleErrorResponse(errorMessage: string): TimestampedProviderErrorResponse {
    logger.error(errorMessage)
    const error = buildErrorResponse(errorMessage)
    return error
  }
}

export const addressEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'address',
  transport: new AddressTransport(),
  inputParameters,
})
