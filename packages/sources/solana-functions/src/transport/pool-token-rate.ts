import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { BaseEndpointTypes, inputParameters } from '../endpoint/pool-token-rate'
import { fetchDataFromBufferLayoutStateAccount } from '../shared/buffer-layout-accounts'
import { SolanaRpcFactory } from '../shared/solana-rpc-factory'

const logger = makeLogger('PoolTokenRateTransport')

const RESULT_DECIMALS = 18

type RequestParams = typeof inputParameters.validated

export class PoolTokenRateTransport extends SubscriptionTransport<BaseEndpointTypes> {
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
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const { programAddress, data } = await fetchDataFromBufferLayoutStateAccount({
      stateAccountAddress: params.stakePoolAccountAddress,
      rpc: this.rpc,
    })

    if (!('totalLamports' in data) || !('poolTokenSupply' in data)) {
      throw new AdapterInputError({
        message: `Expected account data for program '${programAddress}' to contain 'totalLamports' and 'poolTokenSupply' fields. Found fields: ${Object.keys(
          data,
        ).join(', ')}`,
        statusCode: 500,
      })
    }

    const totalLamports = BigInt(String(data.totalLamports))
    const poolTokenSupply = BigInt(String(data.poolTokenSupply))
    const rate = (totalLamports * 10n ** BigInt(RESULT_DECIMALS)) / poolTokenSupply
    const result = rate.toString()

    return {
      data: {
        rate: result,
        decimals: RESULT_DECIMALS,
        totalLamports: totalLamports.toString(),
        poolTokenSupply: poolTokenSupply.toString(),
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

export const poolTokenRateTransport = new PoolTokenRateTransport()
