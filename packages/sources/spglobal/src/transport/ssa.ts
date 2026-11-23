import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  makeLogger,
  sleep,
  TimestampedProviderResult,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/ssa'
import { getToken } from '../lib/auth'
import { getSecurities } from '../lib/ssa'

const logger = makeLogger('SsaTransport')

type RequestParams = typeof inputParameters.validated

export class SsaTransport extends SubscriptionTransport<BaseEndpointTypes> {
  config!: BaseEndpointTypes['Settings']
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.requester = dependencies.requester
  }
  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    if (entries.length > 0) {
      await this.handleRequest(entries)
    }
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(params: RequestParams[]) {
    let response: TimestampedProviderResult<BaseEndpointTypes>[]
    try {
      response = await this._handleRequest()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = params.map((param) => ({
        params: param,
        response: {
          statusCode: (e as AdapterError)?.statusCode || 502,
          errorMessage,
          timestamps: {
            providerDataRequestedUnixMs: 0,
            providerDataReceivedUnixMs: 0,
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      }))
    }
    await this.responseCache.write(this.name, response)
  }

  async _handleRequest(): Promise<TimestampedProviderResult<BaseEndpointTypes>[]> {
    const providerDataRequestedUnixMs = Date.now()

    const token = await getToken(
      this.config.AUTH_API_ENDPOINT,
      this.config.AUTH_API_KEY,
      this.requester,
    )

    const securities = await getSecurities(
      this.config.API_ENDPOINT,
      token,
      this.config.API_KEY,
      this.requester,
    )

    const timestamps = {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: undefined,
    }

    return securities.map((item) => {
      const params = { security_id: String(item.security_id).toUpperCase() }
      const ssa = item.ssa
      const time = item.time

      if (isNaN(ssa) || !Number.isInteger(ssa) || ssa < 1 || ssa > 5) {
        return {
          params,
          response: {
            statusCode: 502,
            errorMessage: `Invalid SSA ${ssa} for security ${params.security_id}`,
            timestamps,
          },
        }
      }

      if (!isFinite(time)) {
        return {
          params,
          response: {
            statusCode: 502,
            errorMessage: `Invalid last_modified_date_time ${time} for security ${params.security_id}`,
            timestamps,
          },
        }
      }

      return {
        params,
        response: {
          data: {
            result: ssa,
          },
          result: ssa,
          timestamps: {
            ...timestamps,
            providerIndicatedTimeUnixMs: time,
          },
        },
      }
    })
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const ssaTransport = new SsaTransport()
