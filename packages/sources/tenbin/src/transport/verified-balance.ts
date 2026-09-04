import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/verified-balance'
import { verifyAttestResponse } from './util'

const logger = makeLogger('VerifiedBalanceTransport')

type RequestParams = typeof inputParameters.validated

export type AttestResponse = {
  data: {
    // ...
    agg_usd_computed_balance: string
  }
  canonical: string
  nonce: string
  attestation: {
    jwt: string
    audience: string
    token_type: string
  }
}

export type BuildJsonResponse = {
  release_tag: string
  source_report: string
  commit: string
  short_commit: string
  image: string
  image_digest: string
  endpoint: string
}

export class VerifiedBalanceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  endpointName!: string
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
    this.endpointName = endpointName
    this.requester = dependencies.requester
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
    _params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const [attestResponse, buildJsonResponse] = await Promise.all([
      this.getAttestResponse(),
      this.getBuildJsonResponse(),
    ])

    verifyAttestResponse(attestResponse, buildJsonResponse)

    const { data } = attestResponse
    const result = data.agg_usd_computed_balance

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

  async getAttestResponse(): Promise<AttestResponse> {
    const requestConfig = {
      method: 'GET',
      baseURL: this.config.API_ENDPOINT,
      headers: {
        Authorization: `Bearer ${this.config.API_KEY}`,
      },
    }

    const requestKey = this.config.API_ENDPOINT
    const response = await this.requester.request<AttestResponse>(requestKey, requestConfig)
    return response.response.data
  }

  async getBuildJsonResponse(): Promise<BuildJsonResponse> {
    const requestConfig = {
      method: 'GET',
      baseURL: this.config.BUILD_JSON_ENDPOINT,
    }

    const requestKey = this.config.BUILD_JSON_ENDPOINT
    const response = await this.requester.request<BuildJsonResponse>(requestKey, requestConfig)
    return response.response.data
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const customSubscriptionTransport = new VerifiedBalanceTransport()
