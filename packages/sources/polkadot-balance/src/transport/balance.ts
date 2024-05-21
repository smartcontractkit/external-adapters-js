import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterResponse,
  makeLogger,
  sleep,
  splitArrayIntoChunks,
} from '@chainlink/external-adapter-framework/util'
import { ApiPromise, WsProvider } from '@polkadot/api'

const logger = makeLogger('PolkadotBalanceLogger')

interface ProviderResponse {
  nonce: number
  data?: {
    free?: string
  }
}

export type BalanceTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class BalanceTransport extends SubscriptionTransport<BalanceTransportTypes> {
  api!: ApiPromise
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
    this.endpointName = endpointName
    const wsProvider = new WsProvider(adapterSettings.RPC_URL)
    this.api = await ApiPromise.create({ provider: wsProvider })
    await this.api.isReady
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
    const providerDataRequestedUnixMs = Date.now()
    const result: { address: string; balance: string }[] = []

    // Can't utilize a "multi" query here since it doesn't retrieve a snapshot of the balance directly
    // Also addresses are not returned in the results preventing balances to be mapped to them
    const addresses = params.addresses.map(({ address }) => address)
    try {
      // Break addresses down into batches to execute asynchronously
      // Firing requests for all addresses all at once could hit rate limiting for large address pools
      const batchedAddresses = splitArrayIntoChunks(addresses, this.config.BATCH_SIZE)
      for (const batch of batchedAddresses) {
        await Promise.all(
          batch.map((address) => {
            const balancePromise = this.api.query.system.account(address).then((codec) => {
              const balance = codec.toJSON() as unknown as ProviderResponse
              if (balance) {
                result.push({
                  address,
                  balance: parseInt(balance.data?.free || '0x0', 16).toString(),
                })
              }
            })
            return balancePromise
          }),
        )
      }
    } catch (e) {
      logger.error(e, 'Failed to retrieve balances')
      return {
        statusCode: 500,
        errorMessage: 'Failed to retrieve balances',
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }

    const response = {
      data: {
        result,
      },
      result: null,
      statusCode: 200,
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
}

export const transport = new BalanceTransport()
