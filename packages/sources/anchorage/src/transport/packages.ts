import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import Decimal from 'decimal.js'
import { BaseEndpointTypes, inputParameters } from '../endpoint/packages'
import { request } from './requester'

const logger = makeLogger('PackageTransport')

type RequestParams = typeof inputParameters.validated

interface PackageResponse {
  clientReferenceId: string
  collateralAssets: [
    {
      asset: {
        assetType: string
      }
      quantity: string
    },
  ]
}

export class PackagesTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
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
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const response = await request<PackageResponse>(
      this.requester,
      this.settings.COLLATERAL_API_ENDPOINT,
      'v2/collateral_management/packages',
      // Validated not null in endpoint
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.settings.COLLATERAL_API_KEY!,
      this.settings.API_LIMIT,
    )

    const assets = response
      .filter((r) => r.clientReferenceId.toUpperCase() == params.clientReferenceId.toUpperCase())
      .flatMap((r) => r.collateralAssets)

    const result = assets
      .filter((r) => r.asset.assetType.toUpperCase() == params.assetType.toUpperCase())
      .reduce((sum, current) => {
        return sum.add(new Decimal(current.quantity))
      }, new Decimal(0))

    return {
      data: {
        result: result.toString(),
        assets,
      },
      statusCode: 200,
      result: result.toString(),
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

export const packagesTransport = new PackagesTransport()
