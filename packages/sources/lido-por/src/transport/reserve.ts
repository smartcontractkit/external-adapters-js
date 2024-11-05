import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ethers } from 'ethers'
import { TimestampedAdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserve'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import {
  EthereumClResponse,
  parseBeaconBalance,
  getBufferedEther,
  getWithdrawalCredential,
} from './util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'

type RequestParams = typeof inputParameters.validated

export class BalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  config!: BaseEndpointTypes['Settings']
  endpointName!: string
  provider!: ethers.providers.JsonRpcProvider
  ethereumClEndpoint!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.config = adapterSettings
    this.endpointName = endpointName
    const { RPC_URL, CHAIN_ID, ETHEREUM_CL_INDEXER_URL } = adapterSettings
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
    this.ethereumClEndpoint = ETHEREUM_CL_INDEXER_URL
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: TimestampedAdapterResponse
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      const statusCode = (e as AdapterError)?.statusCode || 502
      response = {
        statusCode,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [
      {
        params: param,
        response: response as TimestampedAdapterResponse<BaseEndpointTypes['Response']>,
      },
    ])
  }

  async _handleRequest(param: RequestParams) {
    const providerDataRequestedUnixMs = Date.now()

    const beaconBalance = await this._getBeaconBalance(param.lidoContract)

    if (beaconBalance.isNegative()) {
      return {
        errorMessage: `ethereum-cl-indexer balance endpoint returns negative value ${beaconBalance}`,
        ripcord: true,
        ripcordDetails: JSON.stringify(
          `ethereum-cl-indexer balance endpoint returns negative value`,
        ),
        statusCode: 502,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    const buffer = await getBufferedEther(param.lidoContract, this.provider)

    const balance = beaconBalance.add(buffer).toString()

    return {
      data: {
        result: balance,
      },
      result: balance,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async _getBeaconBalance(lidoContract: string) {
    const withdrawalCredential = await getWithdrawalCredential(lidoContract, this.provider)
    const requestConfig = {
      method: 'post',
      baseURL: this.ethereumClEndpoint,
      data: {
        credentials: [withdrawalCredential],
      },
    }
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.config,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: requestConfig.data,
      transportName: this.name,
    })

    const response = await this.requester.request<EthereumClResponse>(requestKey, requestConfig)
    return parseBeaconBalance(response.response.data, withdrawalCredential)
  }
}

export const balanceTransport = new BalanceTransport()
