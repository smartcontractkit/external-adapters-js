import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterResponse,
  makeLogger,
  sleep,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import {
  DEPOSIT_EVENT_LOOKBACK_WINDOW,
  DEPOSIT_EVENT_TOPIC,
  formatValueInGwei,
  parseLittleEndian,
} from './utils'
import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import { DepositEvent_ABI } from '../config/DepositAbi'
import { PoRBalance } from '@chainlink/external-adapter-framework/adapter/por'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'

const logger = makeLogger('BalanceTransport')

interface StateResponseSchema {
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

export interface BalanceResponse extends PoRBalance {
  address: string
}

export type BalanceTransportTypes = BaseEndpointTypes

export type Address = {
  address: string
}

type RequestParams = typeof inputParameters.validated

export class BalanceTransport extends SubscriptionTransport<BalanceTransportTypes> {
  provider!: ethers.providers.JsonRpcProvider
  requester!: Requester
  config!: BalanceTransportTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BalanceTransportTypes>,
    adapterSettings: BalanceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.provider = new ethers.providers.JsonRpcProvider(
      adapterSettings.ETH_EXECUTION_RPC_URL,
      adapterSettings.CHAIN_ID,
    )
    this.requester = dependencies.requester
    this.endpointName = endpointName
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
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
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const url = `/eth/v1/beacon/states/${params.stateId}/validators`
    const statusList = params.validatorStatus
    const batchSize = this.config.BATCH_SIZE
    const responses = []

    const providerDataRequestedUnixMs = Date.now()
    // If adapter configured with 0 batch size, put all validators in one request to allow skipping batching
    if (batchSize === 0) {
      const addresses = params.addresses.map(({ address }) => address)
      responses.push(await this.queryBeaconChain(url, addresses, statusList))
    } else {
      const batchedAddresses: string[][] = []
      // Separate the address set into the specified batch size
      // Add the batches as comma-separated lists to a new list used to make the requests
      for (let i = 0; i < params.addresses.length / batchSize; i++) {
        batchedAddresses.push(
          params.addresses
            .slice(i * batchSize, i * batchSize + batchSize)
            .map(({ address }) => address),
        )
      }

      const groupSize = this.config.GROUP_SIZE
      const requestGroups = splitArrayIntoChunks(batchedAddresses, groupSize)
      // Make request to beacon API for every batch
      // Send requests in groups
      for (const group of requestGroups) {
        responses.push(
          ...(await Promise.all(
            group.map((addresses) => {
              return this.queryBeaconChain(url, addresses, statusList)
            }),
          )),
        )
      }
    }

    // Flatten the results into single array for validators and balances
    const validatorBatches = responses.map(({ data }) => data)
    const balances: BalanceResponse[] = []
    const validators: ValidatorState[] = []
    validatorBatches.forEach((data) => {
      data.forEach((validator) => {
        validators.push(validator)
        balances.push({
          address: validator.validator.pubkey,
          balance: validator.balance,
        })
      })
    })

    // Get validators not found on the beacon chain
    const unfoundValidators = params.addresses.filter(
      ({ address }) => !balances.find((balance) => balance.address === address),
    )

    // If searchLimboValidators param set to true, search deposit events for validators not found on the beacon chain
    // Otherwise, record 0 for the balance of missing validators
    if (params.searchLimboValidators) {
      balances.push(...(await this.searchLimboValidators(unfoundValidators)))
    } else {
      // Populate balances list with addresses that were filtered out with a 0 balance
      // Prevents empty array being returned which would ultimately fail at the reduce step
      // Keep validators list as is to maintain the response received from consensus client
      unfoundValidators.forEach(({ address }) => {
        balances.push({
          address,
          balance: '0',
        })
      })
    }

    const response = {
      data: {
        result: balances,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    return response
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private async queryBeaconChain(
    url: string,
    addresses: string[],
    statusList?: string[],
  ): Promise<StateResponseSchema> {
    const requestConfig = {
      method: 'POST',
      baseURL: this.config.ETH_CONSENSUS_RPC_URL,
      url,
      data: { ids: addresses, statuses: statusList?.length ? statusList : undefined },
    }

    const res = await this.requester.request<StateResponseSchema>(
      calculateHttpRequestKey<BalanceTransportTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: requestConfig.data,
        transportName: this.name,
      }),
      requestConfig,
    )

    return res.response.data
  }

  private async searchLimboValidators(unfoundValidators: Address[]): Promise<BalanceResponse[]> {
    const balances: BalanceResponse[] = []
    const limboAddressMap: Record<string, Address> = {}
    // Parse unfound validators into a map for easier access in limbo search
    unfoundValidators.forEach((validator) => {
      limboAddressMap[validator.address.toLowerCase()] = validator
    })

    // Returns map of validators found in limbo with balances in wei
    const limboBalances = await this.fetchLimboEthBalances(limboAddressMap)

    unfoundValidators.forEach((validator) => {
      const limboBalance = limboBalances[validator.address.toLowerCase()]
      if (limboBalance) {
        balances.push({
          address: validator.address,
          balance: formatValueInGwei(limboBalance),
        })
      } else {
        balances.push({
          address: validator.address,
          balance: '0',
        })
      }
    })

    return balances
  }

  private async fetchEthDepositContractAddress(): Promise<string> {
    const url = `/eth/v1/config/deposit_contract`
    const requestConfig = {
      baseURL: this.config.ETH_CONSENSUS_RPC_URL,
      url,
    }

    const res = await this.requester.request<{ data: { chainId: string; address: string } }>(
      calculateHttpRequestKey<BalanceTransportTypes>({
        context: {
          adapterSettings: this.config,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: {},
        transportName: this.name,
      }),
      requestConfig,
    )
    return res.response.data.data.address
  }

  // Get event logs to find deposit events for addresses not on the beacon chain yet
  // Returns deposit amount in wei
  private async fetchLimboEthBalances(
    limboAddressMap: Record<string, Address> = {},
  ): Promise<Record<string, BigNumber>> {
    // Aggregate balances in map in case validators have multiple deposit events
    const limboBalances: Record<string, BigNumber> = {}

    // Skip fetching logs if no addresses in limbo to search for
    if (Object.entries(limboAddressMap).length === 0) {
      return limboBalances
    }

    const latestBlockNum = await this.provider.getBlockNumber()

    const ethDepositContractAddress = await this.fetchEthDepositContractAddress()

    // Get all the deposit logs from the last DEPOSIT_EVENT_LOOKBACK_WINDOW blocks
    const logs = await this.provider.getLogs({
      address: ethDepositContractAddress,
      topics: [DEPOSIT_EVENT_TOPIC],
      fromBlock: latestBlockNum - DEPOSIT_EVENT_LOOKBACK_WINDOW,
      toBlock: latestBlockNum,
    })

    if (logs.length === 0) {
      logger.debug(
        `No deposit event logs found in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks or the provider failed to return any.`,
      )
      return limboBalances
    }

    logger.debug(
      `Found ${logs.length} deposit events in the last ${DEPOSIT_EVENT_LOOKBACK_WINDOW} blocks`,
    )

    // Parse the fetched logs with the deposit event interface
    const depositEventInterface = new ethers.utils.Interface(DepositEvent_ABI)
    const parsedlogs = logs
      .map((l) => depositEventInterface.parseLog(l))
      .map((l) => ({
        address: l.args[0].toLowerCase(),
        amount: parseLittleEndian(l.args[2].toString()),
      }))

    for (const { address, amount } of parsedlogs) {
      if (limboAddressMap[address]) {
        logger.debug(`Found deposit event for validator ${address}`)
        // If address found in limbo balance map, multiple deposit events exists for validator. Sum all of them
        if (limboBalances[address]) {
          limboBalances[address] = limboBalances[address].plus(amount)
        } else {
          limboBalances[address] = amount
        }
      }
    }

    return limboBalances
  }
}

export const balanceTransport = new BalanceTransport()
