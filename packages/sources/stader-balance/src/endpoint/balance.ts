import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config'
import { buildErrorResponse } from '../util'
import { ethers } from 'ethers'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { StaderPenaltyContract_ABI } from '../abi/StaderContractAbis'

const logger = makeLogger('StaderBalanceLogger')

const VALIDATOR_DEPOSIT = 32000000000
const EXITED_STATUSES = ['exited_unslashed', 'exited_slashed']

type NetworkChainMap = {
  [network: string]: {
    [chain: string]: {
      poolFactory: string
      penalty: string
      stakePoolsManager: string
      ethx: string
    }
  }
}

const networks = ['ethereum']
const chainIds = ['mainnet', 'goerli']

const staderNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: {
      poolFactory: '0x00eA010E050Ba28976059241B2cF558b96D1d2B7',
      penalty: '0x00eA010E050Ba28976059241B2cF558b96D1d2B7',
      stakePoolsManager: '0x00eA010E050Ba28976059241B2cF558b96D1d2B7',
      ethx: '0x00eA010E050Ba28976059241B2cF558b96D1d2B7',
    },
    goerli: {
      poolFactory: '',
      penalty: '',
      stakePoolsManager: '',
      ethx: '',
    },
  },
}

const inputParameters = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
  stateId: {
    type: 'string',
    description: 'The beacon chain state ID to query',
    default: 'finalized',
  },
  validatorStatus: {
    required: false,
    type: 'array',
    description: 'A filter to apply validators by their status',
  },
  penaltyAddress: {
    description: 'The address of the Stader Penalty contract.',
    type: 'string',
  },
  poolFactoryAddress: {
    description: 'The address of the Stader PoolFactory contract.',
    type: 'string',
  },
  stakeManagerAddress: {
    description: 'The adddress of the Stader StakeManager contract',
    type: 'string',
  },
  network: {
    description: 'The name of the target custodial network protocol',
    options: networks,
    type: 'string',
    default: 'ethereum',
  },
  chainId: {
    description: 'The name of the target custodial chain',
    options: chainIds,
    type: 'string',
    default: 'mainnet',
  },
  elRewardAddresses: {
    description: 'List of unique execution layer reward addresses',
    type: 'array',
    required: true,
  },
  socializingPoolAddresses: {
    description: 'List of socializing pool addresses',
    type: 'array',
    required: true,
  },
} satisfies InputParameters

interface RequestParams {
  addresses: Address[]
  stateId: string
  validatorStatus?: string[]
  penaltyAddress?: string
  poolFactoryAddress?: string
  stakeManagerAddress?: string
  network: string
  chainId: string
  elRewardAddresses: string[]
  socializingPoolAddresses: string[]
}

type Address = {
  network: string
  chainId: string
  address: string
  status: string
  initialBondEth: number
  withdrawVaultAddress: string
  operatorId: number
  poolId: number
}

interface BalanceResponse {
  address: string
  balance: string
}

interface ProviderResponse {
  execution_optimistic: false
  data: ValidatorState[]
}

interface ValidatorState {
  index: string
  balance: string
  status: string
  validator: {
    pubkey: string
    withdrawal_credentials: string
    effective_balance: string
    slashed: boolean
    activation_eligibility_epoch: string
    activation_epoch: string
    exit_epoch: string
    withdrawable_epoch: string
  }
}

interface ResponseSchema {
  Data: {
    result: BalanceResponse[]
  }
  Result: null
}

type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: ResponseSchema
  Settings: typeof config.settings
}

const chunkArray = (addresses: string[], size: number): string[][] =>
  addresses.length > size
    ? [addresses.slice(0, size), ...chunkArray(addresses.slice(size), size)]
    : [addresses]

export class BalanceTransport implements Transport<EndpointTypes> {
  name!: string
  responseCache!: ResponseCache<{
    Request: EndpointTypes['Request']
    Response: EndpointTypes['Response']
  }>
  provider!: ethers.providers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<EndpointTypes>,
    adapterSettings: typeof config.settings,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.name = 'default_single_transport'
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.CHAIN_ID,
    )
  }

  async foregroundExecute(
    req: AdapterRequest<EndpointTypes['Request']>,
    settings: typeof config.settings,
  ): Promise<AdapterResponse<EndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    let validatorStateList: ValidatorState[] = []
    const balances: BalanceResponse[] = []
    const addresses = req.requestContext.data.addresses

    // Return a list of validator state for every address
    try {
      validatorStateList = await this.queryValidatorBalances(req, settings)
    } catch (e) {
      const errorMessage = 'Failed to retrieve balances'
      logger.error(e, 'Failed to retrieve balances')
      return buildErrorResponse(errorMessage, providerDataRequestedUnixMs)
    }

    // Perform validator level calculations
    try {
      await this.performValidatorCalculations(
        addresses,
        validatorStateList,
        balances,
        req,
        settings,
      )
    } catch (e) {
      const errorMessage = 'Failed to calculate balances for validators'
      logger.error(errorMessage)
      const error = buildErrorResponse(errorMessage, providerDataRequestedUnixMs)
      return error
    }

    // Perform once per PoR call calculations

    // Get validators' fee recipient addresses balances
    try {
      await Promise.all(
        req.requestContext.data.elRewardAddresses.map(async (address) => {
          const poolBalance = await this.getAddressBalance(address, settings)
          balances.push({ address, balance: poolBalance.toString() })
        }),
      )
    } catch (e) {
      const errorMessage = "Failed to retrieve validators' fee recipient addresses balances"
      logger.error(errorMessage)
      const error = buildErrorResponse(errorMessage, providerDataRequestedUnixMs)
      return error
    }

    // Get permissionless/permissioned pool address balances
    // try {
    //   await Promise.all(
    //     req.requestContext.data.socializingPoolAddresses.map(async (address) => {
    //       const poolBalance = await this.getAddressBalance(address, settings)
    //       balances.push({ address, balance: poolBalance.toString() })
    //     }),
    //   )
    // } catch (e) {
    //   const errorMessage = 'Failed to retrieve balances for socializing pool addresses'
    //   logger.error(errorMessage)
    //   const error = buildErrorResponse(errorMessage, providerDataRequestedUnixMs)
    //   return error
    // }

    // Get inactive pool balance from Stader's StakePoolManager contract
    try {
      const stakePoolManagerContract =
        req.requestContext.data.stakeManagerAddress ||
        staderNetworkChainMap[req.requestContext.data.network][req.requestContext.data.chainId]
          .stakePoolsManager
      const stakeManagerBalance = await this.getAddressBalance(stakePoolManagerContract, settings)
      logger.debug(`Balance on StakeManager contract: ${stakeManagerBalance}`)
      balances.push({
        address: stakePoolManagerContract,
        balance: stakeManagerBalance.toString(),
      })
    } catch (e) {
      const errorMessage = 'Failed to retrieve the StakeManager contract balance'
      logger.error(errorMessage)
      const error = buildErrorResponse(errorMessage, providerDataRequestedUnixMs)
      return error
    }

    const result = {
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
    await this.responseCache.write(this.name, [
      {
        params: req.requestContext.data,
        response: result,
      },
    ])
    return result
  }

  async queryValidatorBalances(
    req: AdapterRequest<EndpointTypes['Request']>,
    settings: typeof config.settings,
  ): Promise<ValidatorState[]> {
    const url = `/eth/v1/beacon/states/${req.requestContext.data.stateId}/validators`
    const statusList = req.requestContext.data.validatorStatus?.join(',')
    const batchSize = Number(settings.BATCH_SIZE)
    const batchedAddresses = []
    const responses: AxiosResponse<ProviderResponse>[] = []
    const result: ValidatorState[] = []
    const addresses = req.requestContext.data.addresses
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
  }

  async performValidatorCalculations(
    addresses: Address[],
    validatorStateList: ValidatorState[],
    balances: BalanceResponse[],
    req: AdapterRequest<EndpointTypes['Request']>,
    settings: typeof config.settings,
  ): Promise<void> {
    await Promise.all(
      addresses.map(async (validator) => {
        const state = validatorStateList.find(
          (validatorState) => validator.address === validatorState.validator.pubkey,
        )
        const validatorAddress = validator.address
        const withdrawalAddress = validator.withdrawVaultAddress
        logger.debug(`Validator's (${validatorAddress}) withdrawal address: ${withdrawalAddress}`)
        if (state) {
          logger.debug(`Validator (${validatorAddress}) found on beacon`)
          const userDeposit = VALIDATOR_DEPOSIT - validator.initialBondEth
          logger.debug(
            `Validator (${validatorAddress}): Initial Bond ETH: ${validator.initialBondEth}. User Deposit: ${userDeposit}`,
          )
          logger.debug(`Validator (${validatorAddress}) is "${state.status}" status`)
          // Validator has NOT exited
          if (!EXITED_STATUSES.includes(state.status.toLowerCase())) {
            const validatorBalance = Number(state.balance)
            logger.debug(
              `Non-exited validator (${validatorAddress}) beacon balance: ${validatorBalance}`,
            )
            let userBalancePrelim
            // Validator balance greater than or equal to validator deposit. Perform calculations.
            if (validatorBalance >= VALIDATOR_DEPOSIT) {
              const protocolFeePercent = await this.getProtocolFeePercent(validator.poolId, req)
              const operatorFeePercent = await this.getOperatorFeePercent(validator.poolId, req)
              const commission = protocolFeePercent + operatorFeePercent
              logger.debug(
                `Non-exited validator's (${validatorAddress}) pool's ${validator.poolId} protocol fee percentage: ${commission}, operator fee percentage: ${operatorFeePercent}, and commission: ${commission}`,
              )
              userBalancePrelim =
                userDeposit +
                (validatorBalance - VALIDATOR_DEPOSIT) *
                  (userDeposit / VALIDATOR_DEPOSIT) *
                  (1 - commission)
              logger.debug(
                `Non-exited validator (${validatorAddress}) balance ${validatorBalance} greater than or equal to ${VALIDATOR_DEPOSIT}. Calculated user balance prelim ${userBalancePrelim}`,
              )
            }
            // Validator balance less than validator deposit but greater than or equal to user deposit. Use user deposit.
            else if (validatorBalance >= userDeposit) {
              logger.debug(
                `Non-exited validator (${validatorAddress}) balance ${validatorBalance} less than ${VALIDATOR_DEPOSIT} but greater than or equal to user deposit ${userDeposit}. Using user deposit.`,
              )
              userBalancePrelim = userDeposit
            }
            // Validator balance less than validator deposit and user deposit. Use validator balance.
            else {
              logger.debug(
                `Non-exited validator (${validatorAddress}) balance ${validatorBalance} less than ${VALIDATOR_DEPOSIT} and user deposit ${userDeposit}. Using validator balance.`,
              )
              userBalancePrelim = validatorBalance
            }
            // Get penalty for validator from the Stader Penalty contract
            const penalty = await this.getPenalty(validatorAddress, req, settings)
            logger.debug(`Non-exited validator (${validatorAddress}) penalty: ${penalty}`)
            // Calculate node balance
            const nodeBalance = Math.max(0, validatorBalance - userBalancePrelim - penalty)
            logger.debug(
              `Non-exited validator (${validatorAddress}) calculated node balance: ${nodeBalance}`,
            )
            // Calculate user balance
            const userBalance = validatorBalance - nodeBalance
            logger.debug(
              `Non-exited validator (${validatorAddress}) calculated user balance: ${userBalance}`,
            )
            // TODO: Fix calculations for non-exited withdrawal balances
            const withdrawalBalance = await this.getAddressBalance(withdrawalAddress, settings)
            logger.debug(
              `Non-exited validator (${validatorAddress}) withdrawal balance: ${withdrawalBalance}`,
            )
            const cumulativeBalance = userBalance + withdrawalBalance
            logger.debug(
              `Non-exited validator (${validatorAddress}) cumulative balance: ${cumulativeBalance}`,
            )
            balances.push({ address: validatorAddress, balance: cumulativeBalance.toString() })
          }
          // Validator has exited
          else {
            const withdrawalBalance = await this.getAddressBalance(withdrawalAddress, settings)
            logger.debug(
              `Exited validator (${validatorAddress}) withdrawal balance: ${withdrawalBalance}`,
            )
            // Withdrawal balance greater than or equal to validator deposit. Perform calculations.
            if (withdrawalBalance >= VALIDATOR_DEPOSIT) {
              const protocolFeePercent = await this.getProtocolFeePercent(validator.poolId, req)
              const operatorFeePercent = await this.getOperatorFeePercent(validator.poolId, req)
              const commission = protocolFeePercent + operatorFeePercent
              logger.debug(
                `Exited validator's (${validatorAddress}) pool's ${validator.poolId} protocol fee percentage: ${commission}, operator fee percentage: ${operatorFeePercent}, and commission: ${commission}`,
              )
              const balance =
                userDeposit +
                (withdrawalBalance - VALIDATOR_DEPOSIT) *
                  (userDeposit / VALIDATOR_DEPOSIT) *
                  (1 - commission)
              logger.debug(
                `Exited validator (${validatorAddress}) withdrawal balance ${withdrawalBalance} greater than ${VALIDATOR_DEPOSIT}. Calculated balance ${balance}`,
              )
              balances.push({ address: validatorAddress, balance: balance.toString() })
            }
            // Withdrawal balance less than validator deposit but greater than or equal to user deposit. Use user deposit.
            else if (withdrawalBalance >= userDeposit) {
              logger.debug(
                `Exited validator (${validatorAddress}) withdrawal balance ${withdrawalBalance} less than ${VALIDATOR_DEPOSIT} but greater than or equal to user deposit ${userDeposit}. Using user deposit.`,
              )
              balances.push({ address: validatorAddress, balance: userDeposit.toString() })
            }
            // Withdrawal balance less than validator deposit and user deposit. Use withdrawal balance.
            else {
              logger.debug(
                `Exited validator (${validatorAddress}) withdrawal balance ${withdrawalBalance} less than ${VALIDATOR_DEPOSIT} and user deposit ${userDeposit}. Using withdrawal balance.`,
              )
              balances.push({ address: validatorAddress, balance: withdrawalBalance.toString() })
            }
          }
        } else {
          logger.debug(`Validator (${validatorAddress}) NOT found on beacon`)
          balances.push({ address: validatorAddress, balance: '0' })
        }
      }),
    )
  }

  async getAddressBalance(address: string, settings: typeof config.settings): Promise<number> {
    const options: AxiosRequestConfig = {
      baseURL: settings.ETHEREUM_RPC_URL,
      method: 'POST',
      data: {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 0,
      },
    }
    try {
      return Number((await axios.request<{ result: string }>(options)).data.result)
    } catch (e) {
      logger.error(`Failed to retrieve withdrawal address balance for ${address}`)
      throw e
    }
  }

  async getPenalty(
    validatorAddress: string,
    req: AdapterRequest<EndpointTypes['Request']>,
    settings: typeof config.settings,
  ): Promise<number> {
    const provider = new ethers.providers.JsonRpcProvider(
      settings.ETHEREUM_RPC_URL,
      settings.CHAIN_ID,
    )
    const penaltyAddress =
      req.requestContext.data.penaltyAddress ||
      staderNetworkChainMap[req.requestContext.data.network][req.requestContext.data.chainId]
        .penalty
    const addressManager = new ethers.Contract(penaltyAddress, StaderPenaltyContract_ABI, provider)
    try {
      return await addressManager.calculatePenalty(validatorAddress)
    } catch (e) {
      logger.error(`Failed to retrieve penalty for ${validatorAddress}`)
      throw e
    }
  }

  async getProtocolFeePercent(
    poolId: number,
    req: AdapterRequest<EndpointTypes['Request']>,
  ): Promise<number> {
    const poolFactoryAddress =
      req.requestContext.data.poolFactoryAddress ||
      staderNetworkChainMap[req.requestContext.data.network][req.requestContext.data.chainId]
        .poolFactory
    const addressManager = new ethers.Contract(
      poolFactoryAddress,
      StaderPenaltyContract_ABI,
      this.provider,
    )
    try {
      // TODO: convert to decimal once we know format
      return await addressManager.getProtocolFeePercent(poolId)
    } catch (e) {
      logger.error(`Failed to retrieve Protocol Fee Percent for Pool ID ${poolId}`)
      throw e
    }
  }

  async getOperatorFeePercent(
    poolId: number,
    req: AdapterRequest<EndpointTypes['Request']>,
  ): Promise<number> {
    const poolFactoryAddress =
      req.requestContext.data.poolFactoryAddress ||
      staderNetworkChainMap[req.requestContext.data.network][req.requestContext.data.chainId]
        .poolFactory
    const addressManager = new ethers.Contract(
      poolFactoryAddress,
      StaderPenaltyContract_ABI,
      this.provider,
    )
    try {
      // TODO: convert to decimal once we know format
      return await addressManager.getOperatorFeePercent(poolId)
    } catch (e) {
      logger.error(`Failed to retrieve Operator Fee Percent for Pool ID ${poolId}`)
      throw e
    }
  }
}

export const balanceEndpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'balance',
  transport: new BalanceTransport(),
  inputParameters,
})
