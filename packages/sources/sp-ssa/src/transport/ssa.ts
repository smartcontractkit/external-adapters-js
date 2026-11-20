import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  HttpTransport,
  HttpTransportConfig,
  TransportDependencies,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { inputParameters } from '../endpoint/ssa'
import { AuthManager } from './auth'
import { HttpTransportTypes, parseResponse } from './ssa-scores'

const logger = makeLogger('SsaTransport')

type RequestParams = typeof inputParameters.validated

export class SsaHttpTransport extends HttpTransport<HttpTransportTypes> {
  private authManager!: AuthManager
  private bearerToken = ''

  constructor() {
    const transportConfig: HttpTransportConfig<HttpTransportTypes> = {
      prepareRequests: (params, settings) => ({
        params,
        request: {
          method: 'GET',
          baseURL: settings.API_ENDPOINT,
          url: '/api/v1/ssa/getAllScores',
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            apikey: settings.SPGI_APIKEY,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      }),
      parseResponse,
    }
    super(transportConfig)
  }

  override async initialize(
    dependencies: TransportDependencies<HttpTransportTypes>,
    adapterSettings: HttpTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.authManager = new AuthManager(this.requester, {
      AUTH_API_ENDPOINT: adapterSettings.AUTH_API_ENDPOINT,
      SPGI_CLIENT_ID: adapterSettings.SPGI_CLIENT_ID,
      BACKGROUND_EXECUTE_MS_HTTP: adapterSettings.BACKGROUND_EXECUTE_MS_HTTP,
    })
  }

  // The token is shared by every entry of the batch, so it is refreshed once
  // before the scores GET. An empty batch makes no provider call.
  override async backgroundHandler(
    context: EndpointContext<HttpTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (entries.length) {
      try {
        this.bearerToken = await this.authManager.getBearerToken()
      } catch (e) {
        // The login path rejects with an AdapterError that carries the status
        // code and the message to publish, so this catch reuses them.
        const error = e as AdapterError
        logger.error(error.message)

        // A login failure has no provider call, so the entries get the zero
        // times; the wait paces the next login attempt when the token
        // endpoint keeps failing.
        await this.responseCache.write(
          this.name,
          entries.map((params) => ({
            params,
            response: {
              statusCode: error.statusCode,
              errorMessage: error.message,
              timestamps: {
                providerDataRequestedUnixMs: 0,
                providerDataReceivedUnixMs: 0,
                providerIndicatedTimeUnixMs: undefined,
              },
            },
          })),
        )
        await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
        return
      }
    }

    await super.backgroundHandler(context, entries)
  }
}

export const httpTransport = new SsaHttpTransport()
