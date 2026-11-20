import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterResponse,
  makeLogger,
  sleep,
  validateResultNumber,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/ssa'
import { AuthManager } from './auth'

const logger = makeLogger('SsaTransport')

type RequestParams = typeof inputParameters.validated

// One record of the scores list, as the S&P API returns it.
export interface SsaScoreRecord {
  last_modified_date_time: string
  security_id: string
  ssa: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: SsaScoreRecord[]
  }
}

export class SsaHttpTransport extends SubscriptionTransport<HttpTransportTypes> {
  requester!: Requester
  settings!: HttpTransportTypes['Settings']
  endpointName!: string
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
    this.endpointName = endpointName
    this.authManager = new AuthManager(this.requester, {
      AUTH_API_ENDPOINT: this.settings.AUTH_API_ENDPOINT,
      SPGI_CLIENT_ID: this.settings.SPGI_CLIENT_ID,
      BACKGROUND_EXECUTE_MS_HTTP: this.settings.BACKGROUND_EXECUTE_MS_HTTP,
    })
  }

  async backgroundHandler(context: EndpointContext<HttpTransportTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
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
    param: RequestParams,
  ): Promise<AdapterResponse<HttpTransportTypes['Response']>> {
    const { security_id: securityId } = param

    const token = await this.authManager.getBearerToken()
    const { records, timestamps } = await this.getScores(token)

    if (!Array.isArray(records)) {
      throw new AdapterError({
        statusCode: 502,
        message: 'The SSA reply is not a JSON array',
      })
    }

    const record = records.find((item) => item.security_id === securityId)
    if (!record) {
      throw new AdapterError({
        statusCode: 502,
        message: `The SSA reply has no record for security_id ${securityId}`,
      })
    }

    const validated = validateResultNumber(
      record.ssa,
      `The SSA score for security_id ${securityId} is not a number`,
    )
    if ('errorMessage' in validated) {
      throw new AdapterError({
        statusCode: 502,
        message: validated.errorMessage,
      })
    }
    const result = validated.result

    if (!Number.isInteger(result) || result < 1 || result > 5) {
      throw new AdapterError({
        statusCode: 502,
        message: `The SSA score ${result} for security_id ${securityId} is outside the integer range 1-5`,
      })
    }

    if (typeof record.last_modified_date_time !== 'string') {
      throw new AdapterError({
        statusCode: 502,
        message: `The last_modified_date_time ${record.last_modified_date_time} for security_id ${securityId} is not a timestamp`,
      })
    }
    const providerIndicatedTimeUnixMs = new Date(record.last_modified_date_time).getTime()
    if (!Number.isFinite(providerIndicatedTimeUnixMs)) {
      throw new AdapterError({
        statusCode: 502,
        message: `The last_modified_date_time ${record.last_modified_date_time} for security_id ${securityId} is not a timestamp`,
      })
    }
    const recordTimeUnixS = Math.floor(providerIndicatedTimeUnixMs / 1000)

    return {
      statusCode: 200,
      result,
      data: {
        result,
        exchangeRate: result,
        validFromTimestamp: recordTimeUnixS,
        observationsTimestamp: recordTimeUnixS,
      },
      timestamps: {
        providerDataRequestedUnixMs: timestamps.providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: timestamps.providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs,
      },
    }
  }

  async getScores(token: string) {
    const requestConfig = {
      method: 'GET',
      baseURL: this.settings.API_ENDPOINT,
      url: '/api/v1/ssa/getAllScores',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: this.settings.SPGI_APIKEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }

    // The scores list is the same for every security_id, so the request key
    // carries no input and concurrent requests share one provider request.
    const requestKey = calculateHttpRequestKey<HttpTransportTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters,
        endpointName: this.endpointName,
      },
      data: {},
      transportName: this.name,
    })

    const response = await this.requester.request<SsaScoreRecord[]>(requestKey, requestConfig)
    return { records: response.response.data, timestamps: response.timestamps }
  }

  getSubscriptionTtlFromConfig(adapterSettings: HttpTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const httpTransport = new SsaHttpTransport()
