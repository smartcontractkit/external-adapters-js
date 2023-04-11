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
  StaderNodeRegistryContract_ABI,
} from '../abi/StaderContractAbis'
import { config } from '../config'
import { buildErrorResponse, filterDuplicates, validatorsRegistryResponse } from '../utils'

const logger = makeLogger('StaderAddressList')

type NetworkChainMap = {
  [network: string]: {
    [chain: string]: { poolFactory: string; permissionlessNodeRegistry: string }
  }
}

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

export type BasicAddress = {
  address: string
}

export type PoolAddress = BasicAddress & {
  poolId: number
}

export type ValidatorAddress = BasicAddress &
  PoolAddress & {
    network: string
    chainId: string
    withdrawVaultAddress: string
    operatorId: number
    status: number
  }

interface RequestParams {
  poolFactoryAddress?: string
  permissionlessNodeRegistry?: string
  stakeManagerAddress?: string
  penaltyAddress?: string
  permissionedPoolAddress?: string
  staderConfigAddress?: string
  network: string
  chainId: string
  confirmations: number
  validatorStatus?: string[]
  batchSize: number
}

interface ResponseSchema {
  Data: {
    stakeManagerAddress?: string
    poolFactoryAddress?: string
    penaltyAddress?: string
    permissionedPoolAddress?: string
    staderConfigAddress?: string
    validatorStatus?: string[]
    socialPoolAddresses: PoolAddress[]
    elRewardAddresses: BasicAddress[]
    confirmations: number
    network: string
    chainId: string
    result: ValidatorAddress[]
  }
  Result: null
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: ResponseSchema
  Settings: typeof config.settings
}

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
    await Promise.all(
      entries.map(async (req) => {
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
          const [addressList, socialPoolAddresses, elRewardAddresses] = await Promise.all([
            this.fetchValidatorAddressList(
              poolFactoryManager,
              blockTag,
              network,
              chainId,
              batchSize,
            ),
            this.fetchSocializingPoolAddresses(poolFactoryManager, blockTag),
            this.fetchElRewardAddresses(permissionlessNodeRegistryManager, blockTag, batchSize),
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
          response = this.handleErrorResponse(errorMessage, providerDataRequestedUnixMs)
        }

        await this.responseCache.write(this.name, [{ params: req, response }])
      }),
    )
  }

  // Fetch validator addresses and their metadata
  async fetchValidatorAddressList(
    poolFactoryManager: ethers.Contract,
    blockTag: number,
    network: string,
    chainId: string,
    batchSize: number,
  ): Promise<ValidatorAddress[]> {
    try {
      logger.debug('Fetching validator address list')
      const poolCount = await poolFactoryManager.poolCount({ blockTag })
      logger.debug(`Pool Count: ${poolCount}`)
      const addressList: ValidatorAddress[] = []
      for (let i = 1; i <= poolCount; i++) {
        const nodeRegistryAddress: string = await poolFactoryManager.getNodeRegistry(i, {
          blockTag,
        })
        const nodeRegistryManager = new ethers.Contract(
          nodeRegistryAddress,
          StaderNodeRegistryContract_ABI,
          this.provider,
        )
        const validatorCount = (await nodeRegistryManager.nextValidatorId({ blockTag })) - 1
        logger.debug(
          `${validatorCount} addresses in pool ${i}. May not be the number that are active.`,
        )
        // Calculate number of pages based on total validators and batch size
        const pages =
          validatorCount % batchSize === 0
            ? validatorCount / batchSize
            : validatorCount / batchSize + 1
        for (let j = 1; j <= pages; j++) {
          const validators = (await nodeRegistryManager.getAllActiveValidators(j, batchSize, {
            blockTag,
          })) as validatorsRegistryResponse[]
          validators.forEach(([status, pubkey, , , withdrawVaultAddress, operatorId, , ,]) => {
            addressList.push({
              address: pubkey,
              withdrawVaultAddress,
              network,
              chainId,
              operatorId: Number(operatorId),
              poolId: i,
              status,
            })
          })
        }
      }
      return addressList
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve validator addresses from contract')
    }
  }

  // Fetch socializing pool addresses
  async fetchSocializingPoolAddresses(
    poolFactoryManager: ethers.Contract,
    blockTag: number,
  ): Promise<PoolAddress[]> {
    try {
      logger.debug('Fetching socializing pool address list')
      const poolCount = await poolFactoryManager.poolCount({ blockTag })
      let socialPoolAddresses: PoolAddress[] = []
      for (let i = 1; i <= poolCount; i++) {
        const address = await poolFactoryManager.getSocializingPoolAddress(i, { blockTag })
        socialPoolAddresses.push({ address, poolId: i })
      }
      socialPoolAddresses = filterDuplicates<PoolAddress>(socialPoolAddresses)
      return socialPoolAddresses
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve socializing pool addresses from contract')
    }
  }

  // Fetch node EL reward addresses from mapping in the Permissionless Node Registry
  async fetchElRewardAddresses(
    permissionlessNodeRegistryManager: ethers.Contract,
    blockTag: number,
    batchSize: number,
  ): Promise<BasicAddress[]> {
    try {
      logger.debug('Fetching node EL reward address list')
      let elRewardAddresses: BasicAddress[] = []
      const operatorCount =
        (await permissionlessNodeRegistryManager.nextOperatorId({ blockTag })) - 1
      logger.debug(`${operatorCount} operators found in permissionless node registry`)
      // Calculate number of pages based on total operators and batch size
      const pages =
        operatorCount % batchSize === 0 ? operatorCount / batchSize : operatorCount / batchSize + 1
      for (let i = 1; i <= pages; i++) {
        const addresses =
          (await permissionlessNodeRegistryManager.getAllSocializingPoolOptOutOperators(
            i,
            batchSize,
            {
              blockTag,
            },
          )) as string[]

        addresses.forEach((address) => elRewardAddresses.push({ address }))
      }

      elRewardAddresses = filterDuplicates<BasicAddress>(elRewardAddresses)
      return elRewardAddresses
    } catch (e) {
      logger.error({ error: e })
      throw Error('Failed to retrieve node EL reward addresses from contract')
    }
  }

  handleErrorResponse(
    errorMessage: string,
    providerDataRequestedUnixMs: number,
  ): TimestampedProviderErrorResponse {
    logger.error(errorMessage)
    const error = buildErrorResponse(errorMessage, providerDataRequestedUnixMs)
    return error
  }
}

export const addressEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'address',
  transport: new AddressTransport(),
  inputParameters,
})
