import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { inputParameters } from '../endpoint/common'
import { BaseEndpointTypes } from '../endpoint/reserve'
import { AuthManager, AuthSettings } from './helpers/auth'
import { AssetoApiResponseBaseSchema, validateApiResponse } from './helpers/common'
import { RequestHelper } from './helpers/request'

const logger = makeLogger('ReserveTransport')

type RequestParams = typeof inputParameters.validated

interface ApiResponseSchema extends AssetoApiResponseBaseSchema {
  data: ReserveResponseSchema
  timestamp: number
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
  endpointName!: string

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: HttpTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.endpointName = endpointName

    this.authManager = AuthManager.getInstance(this.requester, {
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
    const { data: reserveResponse, timestamp } = await this.getReserve(fundId, token)

    if (!reserveResponse) {
      throw new AdapterError({
        statusCode: 404,
        message: 'No Reserve data found for fund id',
      })
    }

    const result = parseFloat(reserveResponse.totalAum)

    if (reserveResponse.ripcord) {
      const ripcordDetails = JSON.stringify(reserveResponse.ripcordDetails)
      return {
        statusCode: 502,
        result,
        data: {
          fundId: reserveResponse.fundId,
          fundName: reserveResponse.fundName,
          totalAUM: result,
          totalDate: reserveResponse.updatedAt,
          ripcord: reserveResponse.ripcord,
          ripcordDetails,
          errorMessage: `ripcord pulled: ${ripcordDetails}`,
        },
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: new Date(timestamp).getTime() * 1000,
        },
      }
    }

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
        providerIndicatedTimeUnixMs: new Date(timestamp).getTime() * 1000,
      },
    }
  }

  async getReserve(fundId: number, bearerToken: string): Promise<ApiResponseSchema> {
    const requestConfig = RequestHelper.createReserveRequest(
      this.settings.API_ENDPOINT,
      bearerToken,
      fundId,
    )

    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: requestConfig.data || {},
      transportName: this.name,
    })

    const response = await this.requester.request<ApiResponseSchema>(requestKey, requestConfig)
    validateApiResponse(response.response.status, response.response.data)

    return response.response.data
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
