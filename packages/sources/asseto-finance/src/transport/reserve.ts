import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserve'
import { AuthManager, AuthSettings } from './helpers/auth'
import { RequestHelper } from './helpers/request'

const logger = makeLogger('ReserveTransport')

type RequestParams = typeof inputParameters.validated

interface ApiResponseSchema<T> {
  code: number
  message: string
  data: T
}

export interface ReserveResponseSchema {
  fundId: number
  fundName: string
  totalAum: string
  totalSupply: string
  updatedAt: string
  ripcord: string
  ripcordDetails: string[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ReserveResponseSchema
  }
}

class ReserveTransport extends SubscriptionTransport<HttpTransportTypes> {
  requester!: Requester
  settings!: HttpTransportTypes['Settings']
  authManager!: AuthManager

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: HttpTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings

    this.authManager = new AuthManager(this.requester, {
      API_ENDPOINT: this.settings.API_ENDPOINT,
      CLIENT_ID: this.settings.CLIENT_ID,
      CLIENT_SECRET: this.settings.CLIENT_SECRET,
      GRANT_TYPE: this.settings.GRANT_TYPE,
      BACKGROUND_EXECUTE_MS: this.settings.BACKGROUND_EXECUTE_MS,
    } as AuthSettings)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<HttpTransportTypes['Response']>
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
  ): Promise<AdapterResponse<HttpTransportTypes['Response']>> {
    const { fundId } = params
    const providerDataRequestedUnixMs = Date.now()

    const token = await this.authManager.getBearerToken()
    const reserveResponse = await this.getReserve(fundId, token)

    if (!reserveResponse) {
      throw new AdapterError({
        statusCode: 404,
        message: 'No Reserve data found for fund id',
      })
    }

    if (reserveResponse.ripcord) {
      throw new AdapterError({
        statusCode: 502,
        message: `ripcord pulled: ${JSON.stringify(reserveResponse.ripcordDetails)}`,
      })
    }
    const result = parseFloat(reserveResponse.totalAum)

    return {
      statusCode: 200,
      result,
      data: {
        fundId: reserveResponse.fundId,
        fundName: reserveResponse.fundName,
        totalAUM: result,
        totalDate: reserveResponse.updatedAt,
        ripcord: reserveResponse.ripcord,
      },
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        //TODO: figure out what do to when the provider timestamp is > current timestamp
        providerIndicatedTimeUnixMs: Date.now(), //new Date(reserveResponse.updatedAt).getTime(),
      },
    }
  }

  async getReserve(fundId: number, bearerToken: string): Promise<ReserveResponseSchema> {
    const requestConfig = RequestHelper.createReserveRequest(
      this.settings.API_ENDPOINT,
      bearerToken,
      fundId,
    )

    const response = await this.requester.request<ApiResponseSchema<ReserveResponseSchema>>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    if (response.response.status === 401) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Auth invalid, will retry next background execute',
        providerStatusCode: response.response.status,
      })
    } else if (response.response.status !== 200) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unexpected response',
        providerStatusCode: response.response.status,
      })
    } else if (response.response.data.code !== 0) {
      throw new AdapterError({
        statusCode: 502,
        message: response.response.data.message,
      })
    }

    return response.response.data.data as ReserveResponseSchema
  }

  async backgroundHandler(context: EndpointContext<HttpTransportTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  getSubscriptionTtlFromConfig(adapterSettings: HttpTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const reserveTransport = new ReserveTransport()
