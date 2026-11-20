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

  // The token is shared by every entry of the batch and `prepareRequests` is
  // synchronous, so the token is refreshed here before the framework's request
  // path runs. An empty batch only sleeps in the framework handler.
  override async backgroundHandler(
    context: EndpointContext<HttpTransportTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (entries.length) {
      try {
        this.bearerToken = await this.authManager.getBearerToken()
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
        logger.error(errorMessage)
        const statusCode = e instanceof AdapterError ? e.statusCode : 502

        // A login failure has no provider call, so the entries get the zero
        // times; the sleep paces the next login attempt when the token
        // endpoint keeps failing.
        await this.responseCache.write(
          this.name,
          entries.map((params) => ({
            params,
            response: {
              statusCode,
              errorMessage,
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
