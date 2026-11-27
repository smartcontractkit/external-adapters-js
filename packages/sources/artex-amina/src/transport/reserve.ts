import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserve'
import { TokenManager } from './auth'
import { fetchAllPositions } from './request'
import { validateAum } from './utils'

const logger = makeLogger('AminaReserveTransport')

type RequestParams = typeof inputParameters.validated

// The provider names a failure in the JSON body's title. A failure without a
// body is named by its status: the message of a failed HTTP client call can
// carry the request headers, and a positions request holds an access token.
const failureMessage = (error: AdapterError): string => {
  const body = error.errorResponse as string | { title?: string } | undefined
  if (body && typeof body === 'object' && body.title) {
    return body.title
  }
  if (typeof body === 'string' && body) {
    return body
  }
  if (error.providerStatusCode) {
    return `The AMINA request failed with status code ${error.providerStatusCode}`
  }
  return error.message || 'Unknown error occurred'
}

class AminaReserveTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  endpointName!: string
  private tokens = new Map<string, TokenManager>()

  override async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.endpointName = endpointName
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    // A report keeps its token until the provider rejects it. A pass keeps the
    // tokens of the reports that the subscription set still asks for and drops
    // the rest, so the map holds no more tokens than there are reports.
    const reports = new Set(entries.map((param) => this.reportKey(param)))
    const held = new Map<string, TokenManager>()
    for (const [key, tokens] of this.tokens) {
      if (reports.has(key)) {
        held.set(key, tokens)
      }
    }
    this.tokens = held

    await Promise.all(entries.map(async (param) => this.handleRequest(context, param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
  }

  async handleRequest(
    context: EndpointContext<BaseEndpointTypes>,
    param: RequestParams,
  ): Promise<void> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(context, param)
    } catch (e) {
      const errorMessage = failureMessage(e as AdapterError)
      // The requester error carries the request config, and a positions request
      // holds an access token. Only a message that the adapter builds goes to
      // the log and to the response.
      logger.error(errorMessage)
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
    context: EndpointContext<BaseEndpointTypes>,
    params: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const tokens = this.tokensFor(params)
    await tokens.getAccessToken()
    const providerDataRequestedUnixMs = Date.now()
    const positions = await fetchAllPositions(
      this.requester,
      context,
      this.name,
      tokens,
      params.portfolio,
    )
    const providerDataReceivedUnixMs = Date.now()

    const [match, ...duplicates] = positions.filter((position) => position.isin === params.isin)
    if (!match) {
      throw new AdapterError({
        statusCode: 502,
        message: `No position found for ISIN ${params.isin} in portfolio ${params.portfolio}`,
      })
    }
    if (duplicates.length > 0) {
      throw new AdapterError({
        statusCode: 502,
        message: `More than one position matches ISIN ${params.isin} in portfolio ${params.portfolio}`,
      })
    }

    // The provider's quantity is the aum as it is: a share count, not a value
    // in a currency, so the adapter applies no rate, scale or rounding.
    const result = validateAum(match.quantity, params.isin)

    return {
      statusCode: 200,
      result,
      data: {
        result,
        navPerShare: 0,
        navDate: 0,
        aum: result,
        ripcord: false,
        ripcordAsInt: 0,
      },
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs,
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  // One token serves every GET of a report, and the report keeps it across
  // background passes until the provider rejects it.
  private tokensFor(params: RequestParams): TokenManager {
    const key = this.reportKey(params)
    const held = this.tokens.get(key)
    if (held) {
      return held
    }

    const tokens = new TokenManager(this.requester, this.settings, this.endpointName, this.name)
    this.tokens.set(key, tokens)
    return tokens
  }

  private reportKey(params: RequestParams): string {
    return this.responseCache.getCacheKey(this.name, params)
  }
}

export const httpTransport = new AminaReserveTransport()
