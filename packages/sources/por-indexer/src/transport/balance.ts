import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterResponse,
  sleep,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { calculateReserves } from '../lib/btc/por'

export type TotalBalanceTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class TotalBalanceTransport extends SubscriptionTransport<TotalBalanceTransportTypes> {
  requester!: Requester
  config!: TotalBalanceTransportTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<TotalBalanceTransportTypes>,
    adapterSettings: TotalBalanceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.config = adapterSettings
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
    const { minConfirmations, addresses } = params
    const balanceRequests = new Map<
      string,
      { network: string; chainId: string; addresses: string[] }
    >()

    for (const { network, chainId, address } of addresses) {
      const id = `${network}_${chainId}`.toUpperCase()
      if (!balanceRequests.has(id)) {
        balanceRequests.set(id, { network, chainId, addresses: [] })
      }
      balanceRequests.get(id)!.addresses.push(address)
    }

    const providerDataRequestedUnixMs = Date.now()
    let totalReserves = new Decimal(0)

    for (const [networkId, { network, chainId, addresses: networkAddresses }] of balanceRequests) {
      if (
        network === 'bitcoin' &&
        chainId === 'mainnet' &&
        this.config.BITCOIN_MAINNET_USE_STREAMS_INDEXER
      ) {
        const rpcUrl = this.config.BITCOIN_MAINNET_RPC_URL

        if (!rpcUrl) {
          throw new AdapterError({
            message:
              "'BITCOIN_MAINNET_RPC_URL' environment variable is required when BITCOIN_MAINNET_USE_STREAMS_INDEXER is enabled.",
          })
        }

        const networkTotal = await calculateReserves(
          this.requester,
          rpcUrl,
          networkAddresses,
          minConfirmations,
          this.config.BATCH_SIZE,
        )
        totalReserves = totalReserves.add(new Decimal(networkTotal.toString()))
        continue
      }

      const indexerEndpointEnvName = `${networkId}_POR_INDEXER_URL` as keyof typeof this.config
      const indexerUrl = this.config[indexerEndpointEnvName] as string

      if (!indexerUrl) {
        throw new AdapterError({
          message: `'${indexerEndpointEnvName}' environment variable is required.`,
        })
      }

      const addressBatches = splitArrayIntoChunks(networkAddresses, this.config.BATCH_SIZE)
      for (const addressBatch of addressBatches) {
        const requestResult = await this._makePorIndexerRequest(
          indexerUrl,
          addressBatch,
          minConfirmations,
        )
        const batchTotal = new Decimal(requestResult.response.data.data.totalReserves)
        if (!batchTotal.isFinite() || batchTotal.isNaN()) {
          throw new AdapterError({
            message: `Invalid totalReserves answer: ${batchTotal.toString()}`,
          })
        }
        totalReserves = totalReserves.add(batchTotal)
      }
    }

    const result = totalReserves.toString()

    return {
      data: {
        result,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  private async _makePorIndexerRequest(url: string, addresses: string[], minConfirmations: number) {
    const requestConfig = {
      method: 'post',
      baseURL: url,
      data: {
        id: '1',
        data: {
          addresses,
          minConfirmations,
        },
      },
    }
    return this.requester.request<{ data: { totalReserves: string } }>(
      calculateHttpRequestKey<TotalBalanceTransportTypes>({
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
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const balanceTransport = new TotalBalanceTransport()
