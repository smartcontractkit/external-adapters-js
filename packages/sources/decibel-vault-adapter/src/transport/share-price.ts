import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  TimestampedAdapterResponse,
  makeLogger,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/share-price'

const logger = makeLogger('DecibelVaultSharePriceTransport')

type RequestParams = typeof inputParameters.validated

class SharePriceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.endpointName = endpointName
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: TimestampedAdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e: unknown) {
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
  ): Promise<TimestampedAdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const { APTOS_RPC_URL, MODULE_ADDRESS } = this.settings
    const { vault_object_id, output_decimals } = param

    const navResult = await this.callViewFunction(
      APTOS_RPC_URL,
      `${MODULE_ADDRESS}::vault::get_vault_net_asset_value`,
      [vault_object_id],
    )

    const sharesResult = await this.callViewFunction(
      APTOS_RPC_URL,
      `${MODULE_ADDRESS}::vault::get_vault_num_shares`,
      [vault_object_id],
    )

    const nav = BigInt(navResult)
    const shares = BigInt(sharesResult)

    if (shares === 0n) {
      throw new AdapterError({
        statusCode: 502,
        message: 'INVALID_SHARES: vault total shares is zero',
      })
    }

    let sharePrice: string
    if (nav === 0n) {
      sharePrice = '0'
    } else {
      sharePrice = ((nav * 10n ** BigInt(output_decimals)) / shares).toString()
    }

    return {
      data: {
        result: Number(sharePrice),
        share_price: sharePrice,
        vault_nav: navResult,
        vault_total_shares: sharesResult,
      },
      result: Number(sharePrice),
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  private async callViewFunction(
    rpcUrl: string,
    functionSignature: string,
    args: string[],
  ): Promise<string> {
    const requestConfig = {
      baseURL: rpcUrl,
      url: '/view',
      method: 'POST' as const,
      headers: { 'Content-Type': 'application/json' },
      data: {
        function: functionSignature,
        type_arguments: [],
        arguments: args,
      },
    }

    const cacheKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: requestConfig.data,
      transportName: this.name,
    })

    const result = await this.requester.request<string[]>(cacheKey, requestConfig)

    if (!Array.isArray(result.response.data) || result.response.data.length === 0) {
      throw new AdapterError({
        statusCode: 502,
        message: `Aptos view function ${functionSignature} returned invalid response: ${JSON.stringify(
          result.response.data,
        )}`,
      })
    }

    return String(result.response.data[0])
  }
}

export const sharePriceTransport = new SharePriceTransport()
