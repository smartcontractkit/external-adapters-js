import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse, sleep, makeLogger } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserve'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getFund } from './fund'
import { getFundNav } from './fundNav'
import { getApiKeys } from './utils'

const logger = makeLogger('NavConsultingTransport')

type RequestParams = typeof inputParameters.validated

type WrappedRequestParams = {
  request: RequestParams
  retry: number
}

export class NavConsultingTransport extends SubscriptionTransport<BaseEndpointTypes> {
  name!: string
  responseCache!: ResponseCache<BaseEndpointTypes>
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  url!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.url = adapterSettings.API_ENDPOINT
    this.settings = adapterSettings
  }
  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(
      entries.map(async (param) =>
        this.handleRequest({ request: param, retry: context.adapterSettings.MAX_RETRIES }),
      ),
    )
    if (entries.length == 0) {
      await sleep(1_000)
    } else {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
    }
  }

  async handleRequest(param: WrappedRequestParams) {
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
    await this.responseCache.write(this.name, [{ params: param.request, response }])
  }

  async _handleRequest(
    param: WrappedRequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const [apiKey, secret] = getApiKeys(param.request.fund)

    const [fundId, date] = await callFunction(
      getFund,
      param.retry,
      this.url,
      apiKey,
      secret,
      this.requester,
    )
    const nav = await callFunction(
      getFundNav,
      param.retry,
      fundId,
      date,
      this.url,
      apiKey,
      secret,
      this.requester,
    )

    return {
      data: {
        result: nav,
      },
      statusCode: 200,
      result: nav,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: new Date(date).valueOf(),
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

async function callFunction<T extends unknown[], R>(
  func: (...args: T) => Promise<R>,
  max_retry: number,
  ...args: T
): Promise<R> {
  let attempts = 0
  const timeToSleep = 10000 // 10 seconds

  while (attempts < max_retry) {
    try {
      return await func(...args)
    } catch (e) {
      attempts++

      if (attempts >= max_retry) throw new Error('Failed after maximum retries.')
      else {
        logger.info(`${max_retry - attempts} retries remaining, sleeping for ${timeToSleep}ms...`)
        await sleep(timeToSleep)
      }
    }
  }
  throw new Error('Unexpected error')
}

export const navConsultingTransport = new NavConsultingTransport()
