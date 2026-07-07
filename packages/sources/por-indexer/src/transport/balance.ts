import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { calculateReserves } from '../lib/btc/por'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'

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
    const addressesByNetwork = new Map<string, string[]>()

    for (const { network, chainId, address } of addresses) {
      if (network !== 'bitcoin') {
        throw new AdapterError({
          message: `Network '${network}' is not supported. Only 'bitcoin' is supported via the streams Bitcoin indexer.`,
        })
      }

      const id = `${network}_${chainId}`.toUpperCase()
      if (!addressesByNetwork.has(id)) {
        addressesByNetwork.set(id, [])
      }
      addressesByNetwork.get(id)!.push(address)
    }

    const providerDataRequestedUnixMs = Date.now()
    let totalReserves = 0n

    for (const [networkId, networkAddresses] of addressesByNetwork.entries()) {
      const rpcUrlEnvName = `${networkId}_RPC_URL` as keyof typeof this.config
      const rpcUrl = this.config[rpcUrlEnvName] as string

      if (!rpcUrl) {
        throw new AdapterError({
          message: `'${rpcUrlEnvName}' environment variable is required.`,
        })
      }

      const networkTotal = await calculateReserves(
        this.requester,
        rpcUrl,
        networkAddresses,
        minConfirmations,
        this.config.BATCH_SIZE,
      )
      totalReserves += networkTotal
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

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const balanceTransport = new TotalBalanceTransport()
