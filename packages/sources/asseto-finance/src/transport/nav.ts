import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/nav'
import { AuthManager, AuthSettings } from './helpers/auth'
import { RequestHelper } from './helpers/request'

const logger = makeLogger('NavTransport')

type RequestParams = typeof inputParameters.validated

interface ApiResponseSchema<T> {
  code: number
  message: string
  data: {
    list: T[]
  }
}

export interface NavResponseSchema {
  fundId: number
  fundName: string
  netAssetValueDate: string
  netAssetValue: string
  assetsUnderManagement: string
  outstandingShares: string
  netIncomeExpenses: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: NavResponseSchema
  }
}

class NavTransport extends SubscriptionTransport<HttpTransportTypes> {
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
    let navResponses = await this.getNav(fundId, token)
    navResponses = navResponses.sort(
      (a, b) => new Date(b.netAssetValueDate).getTime() - new Date(a.netAssetValueDate).getTime(),
    )
    const navResponse = navResponses[0]
    const result = parseFloat(navResponse.netAssetValue)

    return {
      statusCode: 200,
      result,
      data: {
        fundId: navResponse.fundId,
        fundName: navResponse.fundName,
        netAssetValue: result,
        navDate: navResponse.netAssetValueDate,
      },
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: new Date(navResponse.netAssetValueDate).getTime(),
      },
    }
  }

  async getNav(fundId: number, bearerToken: string): Promise<NavResponseSchema[]> {
    const requestConfig = RequestHelper.createNavRequest(
      this.settings.API_ENDPOINT,
      bearerToken,
      fundId,
    )

    const response = await this.requester.request<ApiResponseSchema<NavResponseSchema>>(
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
    }

    const navList = response.response.data.data.list as NavResponseSchema[]
    if (!navList || navList.length === 0) {
      throw new AdapterError({
        statusCode: 404,
        message: 'No NAV data found for fund id',
        providerStatusCode: response.response.status,
      })
    }

    return navList
  }

  async backgroundHandler(context: EndpointContext<HttpTransportTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  getSubscriptionTtlFromConfig(adapterSettings: HttpTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const navTransport = new NavTransport()
