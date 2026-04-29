import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, inputParameters } from '../endpoint/sanctum-infinity'
import { fetchFieldFromBufferLayoutStateAccount } from '../shared/buffer-layout-accounts'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('SanctumInfinityTransport')

const poolStateAddress = 'AYhux5gJzCoeoc1PoJ1VxwPDe22RwcvpHviLDD1oCGvW'
const infinityTokenMintAddress = '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'

type RequestParams = typeof inputParameters.validated

export class SanctumInfinityTransport extends SubscriptionTransport<BaseEndpointTypes> {
  rpc!: Rpc<SolanaRpcApi>

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.rpc = new SolanaRpcFactory().create(adapterSettings.RPC_URL)
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
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
    _params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const [totalPoolValueString, totalPoolTokenSupplyString] = await Promise.all([
      fetchFieldFromBufferLayoutStateAccount({
        stateAccountAddress: poolStateAddress,
        field: 'total_sol_value',
        rpc: this.rpc,
      }),

      fetchFieldFromBufferLayoutStateAccount({
        stateAccountAddress: infinityTokenMintAddress,
        field: 'supply',
        rpc: this.rpc,
      }),
    ])

    const result = Number(totalPoolValueString) / Number(totalPoolTokenSupplyString)

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

export const sanctumInfinityTransport = new SanctumInfinityTransport()
