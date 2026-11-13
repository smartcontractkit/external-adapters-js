import type { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import type { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { type AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
} from '@chainlink/external-adapter-framework/validation/error'
import type { BaseEndpointTypes, inputParameters } from '../endpoint/por'
import { AuthManager } from './auth'
import { mapAminaError } from './errors'
import { fetchAllPositions, selectQuantity } from './positions'

const logger = makeLogger('PorTransport')
const ERROR_CACHE_TTL_MS = 60_000

type RequestParams = typeof inputParameters.validated

class PorTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  authManager!: AuthManager
  private readonly inFlight = new Map<string, Promise<void>>()

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
    let didWork = false
    for (const param of entries) {
      const key = this.responseCache.getCacheKey(this.name, param)
      const cached = await this.responseCache.get(key)
      if (cached) {
        continue
      }
      // A timed-out background execute is not cancelled by the framework and
      // the executor starts the next one in 10ms. Share the same scan instead
      // of starting a second auth + pagination sequence.
      const running = this.inFlight.get(key)
      if (running) {
        await running
        didWork = true
        continue
      }
      const task = this.handleRequest(param, context)
      const tracked = task.finally(() => {
        if (this.inFlight.get(key) === tracked) {
          this.inFlight.delete(key)
        }
      })
      this.inFlight.set(key, tracked)
      await tracked
      didWork = true
    }
    if (!didWork) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
    }
  }

  async handleRequest(
    param: RequestParams,
    context: EndpointContext<BaseEndpointTypes>,
  ): Promise<void> {
    const key = this.responseCache.getCacheKey(this.name, param)
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param, context)
    } catch (error) {
      const mapped = mapAminaError(error)
      logger.error(mapped.message)
      const cached = await this.responseCache.get(key)
      // Preserve a live report. The requirement says a failed scan writes
      // nothing and the previous report remains until expiresAt.
      if (cached && cached.statusCode === 200 && !cached.errorMessage) {
        return
      }
      const errorTimestamps =
        error instanceof AdapterDataProviderError || error instanceof AdapterConnectionError
          ? error.timestamps
          : undefined
      const failedResponse: AdapterResponse<BaseEndpointTypes['Response']> = {
        statusCode: mapped.statusCode,
        errorMessage: mapped.message,
        timestamps: {
          providerDataRequestedUnixMs: errorTimestamps?.providerDataRequestedUnixMs ?? 0,
          providerDataReceivedUnixMs: errorTimestamps?.providerDataReceivedUnixMs ?? 0,
          providerIndicatedTimeUnixMs: errorTimestamps?.providerIndicatedTimeUnixMs,
        },
      }
      await this.responseCache.write(this.name, [{ params: param, response: failedResponse }])
      await this.responseCache.writeTTL(this.name, [param], ERROR_CACHE_TTL_MS)
      return
    }

    const cached = await this.responseCache.get(key)
    const candidateRequestedUnixMs = response.timestamps.providerDataRequestedUnixMs ?? 0
    if (
      cached &&
      cached.statusCode === 200 &&
      !cached.errorMessage &&
      cached.timestamps?.providerDataRequestedUnixMs !== undefined &&
      cached.timestamps.providerDataRequestedUnixMs > candidateRequestedUnixMs
    ) {
      // An older scan finished after a newer one; never overwrite the newer
      // snapshot.
      return
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(
    param: RequestParams,
    context: EndpointContext<BaseEndpointTypes>,
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
      context,
      transportName: this.name,
    })

    const quantity = selectQuantity(result.positions, param.isin)
    return {
      statusCode: 200,
      result: quantity,
      data: {
        result: quantity,
        aum: quantity,
        ripcord: false,
        ripcordAsInt: 0,
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
