import type { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import type { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { type AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import type { BaseEndpointTypes, inputParameters } from '../endpoint/por'
import { AuthManager } from './auth'
import { fetchAllPositions, selectQuantity } from './positions'
import { mapAminaError } from './errors'

const logger = makeLogger('PorTransport')

type RequestParams = typeof inputParameters.validated

class PorTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  authManager!: AuthManager

  override async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.authManager = new AuthManager(this.requester, {
      apiEndpoint: adapterSettings.API_ENDPOINT,
      userId: adapterSettings.AMINA_USER_ID,
      password: adapterSettings.AMINA_PASSWORD,
    })
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    for (const param of entries) {
      const key = this.responseCache.getCacheKey(this.name, param)
      const cached = await this.responseCache.get(key)
      if (!cached) {
        await this.handleRequest(param)
      }
    }
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  async handleRequest(param: RequestParams): Promise<void> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (error) {
      const mapped = mapAminaError(error)
      logger.error(mapped.message)
      response = {
        statusCode: mapped.statusCode,
        errorMessage: mapped.message,
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
    const result = await fetchAllPositions({
      requester: this.requester,
      auth: this.authManager,
      settings: {
        apiEndpoint: this.settings.API_ENDPOINT,
        userId: this.settings.AMINA_USER_ID,
        hmacSecret: this.settings.AMINA_HMAC_SECRET,
        agreementNumber: this.settings.AMINA_AGREEMENT_NUMBER,
      },
      portfolioNo: param.portfolioNo,
    })

    const quantity = selectQuantity(result.positions, param.isin)
    return {
      statusCode: 200,
      result: quantity,
      data: {
        result: quantity,
        aum: quantity,
        ripcord: 0,
        navPerShare: 0,
        navDate: 0,
        nativeFee: 0,
        linkFee: 0,
      },
      timestamps: {
        providerDataRequestedUnixMs: result.firstPageRequestedUnixMs,
        providerDataReceivedUnixMs: result.lastPageReceivedUnixMs,
        providerIndicatedTimeUnixMs: result.firstPageRequestedUnixMs,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const porTransport = new PorTransport()
