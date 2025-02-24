import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/nav'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger, AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AxiosResponse } from 'axios'

const logger = makeLogger('NavTransport')

type RequestParams = typeof inputParameters.validated

export interface AuthRequestSchema {
  client_id: string
  client_secret: string
  scope: string
  grant_type: string
}

export interface AuthResponseSchema {
  token_type: string
  expires_in: number
  ext_expires_in: number
  access_token: string
}

export interface NavResponseSchema {
  accountName: string
  totalReserve: number
  currency: string
  timestamp: string
  ripCord: string
  ripCordDetails: string[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: NavResponseSchema
  }
}

interface TokenDuration {
  token: string
  expiryTimestampMs: number
}

class NavTransport extends SubscriptionTransport<HttpTransportTypes> {
  requester!: Requester
  settings!: HttpTransportTypes['Settings']
  latestToken: TokenDuration | undefined

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: HttpTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
  }

  async backgroundHandler(context: EndpointContext<HttpTransportTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
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
    const { accountName } = params
    const providerDataRequestedUnixMs = Date.now()

    const token = await this.getToken()
    const navResponse = await this.getNav(accountName, token)

    if (navResponse.ripCord) {
      throw new AdapterError({
        statusCode: 502,
        message: `ripcord pulled: ${JSON.stringify(navResponse.ripCordDetails)}`,
      })
    }
    const result = navResponse.totalReserve

    return {
      data: {
        result,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: new Date(navResponse.timestamp).getTime(),
      },
    }
  }

  async getToken(): Promise<string> {
    const now = Date.now()
    const buffer = 2 * this.settings.BACKGROUND_EXECUTE_MS

    // if latestToken is missing or expired/expiring within buffer, grab a new token
    if (!this.latestToken || now > this.latestToken.expiryTimestampMs - buffer) {
      await this.requestAuth()
    }

    if (!this.latestToken) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to getToken',
      })
    }

    return this.latestToken.token
  }

  async requestAuth(): Promise<AxiosResponse<AuthResponseSchema>> {
    const startTimeMs = Date.now()

    const baseURL = this.settings.AUTH_API_ENDPOINT
    const formData = new FormData()
    formData.append('client_id', this.settings.CLIENT_ID)
    formData.append('client_secret', this.settings.CLIENT_SECRET)
    formData.append('scope', this.settings.SCOPE)
    formData.append('grant_type', this.settings.GRANT_TYPE)

    const requestConfig = {
      method: 'POST',
      baseURL,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    }
    const a = await this.requester.request<AuthResponseSchema>(baseURL, requestConfig)
    if (a.response?.status != 200) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unable to auth',
        providerStatusCode: a.response.status,
      })
    }

    this.latestToken = {
      token: a.response.data.access_token,
      expiryTimestampMs: startTimeMs + a.response.data.expires_in * 1000,
    }

    logger.debug('Successfully fetched token')
    return a.response
  }

  async getNav(accountName: string, token: string): Promise<NavResponseSchema> {
    const requestConfig = {
      baseURL: this.settings.NAV_API_ENDPOINT,
      url: `?accountName=${accountName}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    const a = await this.requester.request(JSON.stringify(requestConfig), requestConfig)
    if (a.response.status == 401) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Auth invalid, will retry next background execute',
        providerStatusCode: a.response.status,
      })
    } else if (a.response.status != 200) {
      throw new AdapterError({
        statusCode: 502,
        message: 'Unexpected response',
        providerStatusCode: a.response.status,
      })
    }

    return a.response.data as NavResponseSchema
  }

  getSubscriptionTtlFromConfig(adapterSettings: HttpTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const navTransport = new NavTransport()
