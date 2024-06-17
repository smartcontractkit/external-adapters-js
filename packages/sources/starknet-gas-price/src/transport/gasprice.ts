import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/gasprice'
import { RpcProvider, num, PendingBlock } from 'starknet'
import { AdapterCustomError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('Starknet Gas Price')

export type GasPriceTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class GasPriceTransport extends SubscriptionTransport<GasPriceTransportTypes> {
  provider!: RpcProvider

  async initialize(
    dependencies: TransportDependencies<GasPriceTransportTypes>,
    adapterSettings: GasPriceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new RpcProvider({
      nodeUrl: adapterSettings.STARKNET_RPC_URL,
    })
  }

  async backgroundHandler(
    context: EndpointContext<GasPriceTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<GasPriceTransportTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (e) {
      logger.error(e)
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

  async _handleRequest(): Promise<AdapterResponse<GasPriceTransportTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    let block: PendingBlock
    try {
      block = await this.provider.getBlock('pending')
    } catch (e) {
      throw new AdapterCustomError({
        statusCode: 502,
        message: `RPCProvider GetBlock Failed: ${e}`,
      })
    }

    const result = num.hexToDecimalString(block.l1_gas_price.price_in_fri)

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

  getSubscriptionTtlFromConfig(adapterSettings: GasPriceTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const gasPriceTransport = new GasPriceTransport()
