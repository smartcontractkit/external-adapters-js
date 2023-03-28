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
  StaderPoolAddressContract_ABI,
  StaderPoolFactoryContract_ABI,
  StaderVaultContract_ABI,
} from '../abi/StaderContractAbis'
import { config } from '../config'
import {
  buildErrorResponse,
  filterDuplicates,
  validatorPool,
  validatorsRegistryResponse,
} from '../utils'

const logger = makeLogger('StaderAddressList')

type NetworkChainMap = {
  [network: string]: { [chain: string]: { poolFactory: string; vaultFactory: string } }
}

const networks = ['ethereum']
const chainIds = ['mainnet', 'goerli']

const staderNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: {
      poolFactory: '',
      vaultFactory: '',
    },
    goerli: {
      poolFactory: '0x8A44f6276e44B5b3DC4e4942c7267F235D9b6634',
      vaultFactory: '0x1e19BED3C9bB53317eFB01Daa61253281A1dbC08',
    },
  },
}

const inputParameters = {
  poolFactoryAddress: {
    description: 'The address of the Stader PoolFactory contract.',
    type: 'string',
  },
  vaultFactoryAddress: {
    description: 'The address of the Stader VaultFactory contract.',
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
  }

interface RequestParams {
  poolFactoryAddress: string
  vaultFactoryAddress: string
  stakeManagerAddress: string
  penaltyAddress: string
  network: string
  chainId: string
  confirmations: number
  validatorStatus: string[]
}

interface ResponseSchema {
  Data: {
    stakeManagerAddress: string
    poolFactoryAddress: string
    penaltyAddress: string
    validatorStatus: string[]
    socialPoolAddresses: PoolAddress[]
    elRewardAddresses: BasicAddress[]
    blockTag: number
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
          vaultFactoryAddress: vaultFactoryAddressOverride,
          stakeManagerAddress,
          chainId,
          network,
          validatorStatus,
          penaltyAddress,
        } = req
        const poolFactoryAddress =
          poolFactoryAddressOverride || staderNetworkChainMap[network][chainId].poolFactory
        const vaultFactoryAddress =
          vaultFactoryAddressOverride || staderNetworkChainMap[network][chainId].vaultFactory
        const poolFactoryManager = new ethers.Contract(
          poolFactoryAddress,
          StaderPoolFactoryContract_ABI,
          this.provider,
        )
        const vaultFactoryManager = new ethers.Contract(
          vaultFactoryAddress,
          StaderVaultContract_ABI,
          this.provider,
        )
        const providerDataRequestedUnixMs = Date.now()
        let response: AdapterResponse<EndpointTypes['Response']>
        try {
          const latestBlockNum = await this.provider.getBlockNumber()
          const blockTag = latestBlockNum - confirmations
          const [addressList, socialPoolAddresses] = await Promise.all([
            this.fetchValidatorAddressList(poolFactoryManager, blockTag, network, chainId),
            this.fetchSocializingPoolAddresses(poolFactoryManager, blockTag),
          ])

          const elRewardAddresses = await this.fetchElRewardAddresses(
            vaultFactoryManager,
            addressList,
            blockTag,
          )

          // Build response
          response = {
            data: {
              stakeManagerAddress,
              poolFactoryAddress: poolFactoryAddressOverride,
              penaltyAddress,
              validatorStatus,
              socialPoolAddresses,
              elRewardAddresses,
              blockTag,
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
  ): Promise<ValidatorAddress[]> {
    try {
      logger.debug('Fetching validator address list')
      const poolCount = await poolFactoryManager.poolCount()
      logger.debug(`Pool Count: ${poolCount}`)
      const addressList: ValidatorAddress[] = []
      for (let i = 1; i <= poolCount; i++) {
        const [_poolName, poolAddress] = (await poolFactoryManager.pools(i, {
          blockTag,
        })) as validatorPool
        const poolAddressManager = new ethers.Contract(
          poolAddress,
          StaderPoolAddressContract_ABI,
          this.provider,
        )

        const validators = (await poolAddressManager.getAllActiveValidators({
          blockTag,
        })) as validatorsRegistryResponse[]
        logger.debug(`${validators.length} addresses found in pool ${i}`)
        validators.forEach(([, pubkey, , , withdrawVaultAddress, operatorId, , ,]) => {
          addressList.push({
            address: pubkey,
            withdrawVaultAddress,
            network,
            chainId,
            operatorId: Number(operatorId),
            poolId: i,
          })
        })
      }
      return addressList
    } catch (e) {
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
      throw Error('Failed to retrieve socializing pool addresses from contract')
    }
  }

  // Fetch node EL reward addresses
  async fetchElRewardAddresses(
    vaultFactoryManager: ethers.Contract,
    addressList: ValidatorAddress[],
    blockTag: number,
  ): Promise<BasicAddress[]> {
    try {
      logger.debug('Fetching node EL reward address list')
      let elRewardAddresses: BasicAddress[] = []
      // Maintain a map of operator and pool ID combos already processed
      const operatorMap: Record<number, number[]> = {}

      for (const address of addressList) {
        if (
          operatorMap[address.operatorId] &&
          operatorMap[address.operatorId].includes(address.poolId)
        ) {
          continue
        }

        operatorMap[address.operatorId]
          ? operatorMap[address.operatorId].push(address.poolId)
          : (operatorMap[address.operatorId] = [address.poolId])

        elRewardAddresses.push({
          address: await vaultFactoryManager.computeNodeELRewardVaultAddress(
            address.poolId,
            address.operatorId,
            {
              blockTag,
            },
          ),
        })
      }
      elRewardAddresses = filterDuplicates<BasicAddress>(elRewardAddresses)
      return elRewardAddresses
    } catch (e) {
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
