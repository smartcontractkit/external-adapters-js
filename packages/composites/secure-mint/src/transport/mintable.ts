import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/mintable'
import { getReserve } from './reserve'
import { getSupply } from './supply'

const logger = makeLogger('MintableTransport')

type RequestParams = typeof inputParameters.validated

export class MintableTransport extends SubscriptionTransport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  requester!: Requester
  endpointName!: string
  config!: BaseEndpointTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.endpointName = endpointName
    this.config = adapterSettings
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
        statusCode: (e as AdapterError)?.statusCode || 502,
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
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const [reserve, supply] = await Promise.all([
      getReserve(
        param.token,
        param.reserves,
        this.requester,
        this.config,
        this.endpointName,
        this.name,
      ),
      getSupply(
        param.token,
        param.supplyChains,
        param.supplyChainBlocks,
        this.requester,
        this.config,
        this.endpointName,
        this.name,
      ),
    ])

    const hasSupplyError = Object.values(supply.chains).some((data) => 'error_message' in data)

    // We will prevent minting if there is more supply + pre-mint than reserve
    const overmint = hasSupplyError
      ? false
      : BigInt(supply.mintable) + BigInt(supply.supply) > reserve.reserveAmount

    const data = {
      overmint,
      mintables: hasSupplyError
        ? {}
        : Object.fromEntries(
            Object.entries(supply.chains).map(([id, data]) => [
              id,
              {
                mintable: overmint ? '0' : data.mintable,
                nativeMint: data.token_native_mint,
                totalAborts: data.token_revert_mint,
                mintablePacked: overmint
                  ? '0'
                  : String(
                      BigInt(data.mintable) +
                        BigInt(data.token_native_mint) +
                        BigInt(data.token_revert_mint),
                    ),
                block: data.response_block,
              },
            ]),
          ),
      reserveInfo: {
        reserveAmount: reserve.reserveAmount.toString(),
        timestamp: reserve.timestamp,
        ripcord: reserve.ripcord,
      },
      latestBlocks: Object.fromEntries(
        Object.entries(supply.chains).map(([id, data]) => [id, data.latest_block]),
      ),
      supplyDetails: supply,
    }

    return {
      data,
      statusCode: 200,
      result: 0,
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

export const mintableTransport = new MintableTransport()
