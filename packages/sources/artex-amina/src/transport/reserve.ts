import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserve'
import { AminaAuth, requestIds, signRequest, toProviderError } from './authentication'

const logger = makeLogger('ArtexAminaReserveTransport')

const PAGE_SIZE = 20
const QUANTITY_DECIMALS = 4
const USER_AGENT = 'chainlink-artex-amina-adapter'
// AMINA retry guidance: exponential backoff, capped at 40 seconds.
const MAX_ATTEMPTS = 3
const MAX_BACKOFF_MS = 40_000

type RequestParams = typeof inputParameters.validated

interface PositionSchema {
  isin: string
  quantity: number
}

interface PositionsResponseSchema {
  positions: PositionSchema[]
  totalPages: number
  last: boolean
}

const positionsUri = (portfolio: string): string =>
  `/api/b2c/v1/securities/portfolios/${portfolio}/positions`

const unusable = (message: string): AdapterError =>
  new AdapterError({
    statusCode: 502,
    message: `AMINA positions response is unusable: ${message}`,
  })

// Report a partial or self-contradictory page instead of publishing a wrong reserve.
export const parsePositionsPage = (
  data: unknown,
  expectedPage: number,
): PositionsResponseSchema => {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw unusable('the body is not an object')
  }

  const body = data as Record<string, unknown>
  const totalPages = body.totalPages
  if (typeof totalPages !== 'number' || !Number.isInteger(totalPages) || totalPages < 1) {
    throw unusable('totalPages is not a positive integer')
  }
  if (typeof body.last !== 'boolean') {
    throw unusable('last is not a boolean')
  }
  if (body.number !== expectedPage) {
    throw unusable(
      `page number ${String(body.number)} does not match the requested page ${expectedPage}`,
    )
  }
  const isLastPage = expectedPage + 1 === totalPages
  if (body.last !== isLastPage) {
    throw unusable(
      `last is ${body.last} but page ${expectedPage} of ${totalPages} is ${
        isLastPage ? '' : 'not '
      }last`,
    )
  }
  if (!Array.isArray(body.positions)) {
    throw unusable('positions is not an array')
  }

  const positions = body.positions.map((position, index) => {
    if (typeof position !== 'object' || position === null) {
      throw unusable(`positions[${index}] is not an object`)
    }
    const { isin, quantity } = position as Record<string, unknown>
    if (typeof isin !== 'string') {
      throw unusable(`positions[${index}].isin is not a string`)
    }
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
      throw unusable(`positions[${index}].quantity is not a finite number`)
    }
    return { isin, quantity }
  })

  return { positions, totalPages, last: body.last }
}

const isUnauthorized = (error: unknown): boolean =>
  error instanceof AdapterError && error.providerStatusCode === 401

// The framework retry is disabled, so retry only failures the provider may accept later.
const isTransient = (error: unknown): boolean => {
  // A connection error has no provider status; the framework fills in a
  // synthetic 502, which is not a provider transient failure.
  if (!(error instanceof AdapterError) || error instanceof AdapterConnectionError) {
    return false
  }
  const status = error.providerStatusCode
  return status === 408 || status === 429 || (status !== undefined && status >= 500)
}

export class ReserveTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  auth!: AminaAuth
  baseURL!: string

  override async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.baseURL = adapterSettings.API_ENDPOINT.replace(/\/+$/, '')
    this.auth = new AminaAuth(this.requester, {
      API_ENDPOINT: this.baseURL,
      AMINA_USER_ID: adapterSettings.AMINA_USER_ID,
      AMINA_PASSWORD: adapterSettings.AMINA_PASSWORD,
      AMINA_HMAC_SECRET: adapterSettings.AMINA_HMAC_SECRET,
      AMINA_AGREEMENT_NUMBER: adapterSettings.AMINA_AGREEMENT_NUMBER,
    })
  }

  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: RequestParams[],
  ): Promise<void> {
    if (entries.length === 0) {
      await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS_HTTP)
      return
    }
    await Promise.all(entries.map((param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams): Promise<void> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      // Log the message only: the provider error object carries the outbound
      // request headers, which include the bearer token and the signature.
      logger.error(errorMessage)
      response = {
        statusCode: (error as AdapterError)?.statusCode || 502,
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

  async _handleRequest(): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const token = await this.auth.getAccessToken()
    const providerDataRequestedUnixMs = Date.now()
    const positions = await this.fetchPositions(token)
    const isin = this.settings.AMINA_ISIN
    const matches = positions.filter((position) => position.isin === isin)
    const match = matches[0]

    if (!match) {
      logger.warn(`AMINA returned no position for ISIN ${isin}`)
      throw new AdapterError({
        statusCode: 502,
        message: `AMINA returned no position for ISIN ${isin} in portfolio ${this.settings.AMINA_PORTFOLIO}`,
      })
    }
    if (matches.length > 1) {
      logger.warn(`AMINA returned ${matches.length} positions for ISIN ${isin}`)
      throw new AdapterError({
        statusCode: 502,
        message: `AMINA returned ${matches.length} positions for ISIN ${isin}; exactly one is required`,
      })
    }
    if (match.quantity < 0) {
      throw new AdapterError({
        statusCode: 502,
        message: `AMINA returned a negative quantity for ISIN ${isin}: ${match.quantity}`,
      })
    }

    const result = Number(match.quantity.toFixed(QUANTITY_DECIMALS))

    return {
      statusCode: 200,
      result,
      data: {
        result,
        ripcord: false,
      },
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  // parsePositionsPage rejects a last flag that does not match totalPages.
  async fetchPositions(token: string): Promise<PositionSchema[]> {
    const first = await this.requestPageWithRenewal(0, token)
    let currentToken = first.token
    const firstPage = parsePositionsPage(first.data, 0)
    const positions = [...firstPage.positions]

    let page = 0
    let last = firstPage.last
    while (!last) {
      page += 1
      const next = await this.requestPageWithRenewal(page, currentToken)
      currentToken = next.token
      const nextPage = parsePositionsPage(next.data, page)
      if (nextPage.totalPages !== firstPage.totalPages) {
        throw unusable(`totalPages changed from ${firstPage.totalPages} to ${nextPage.totalPages}`)
      }
      positions.push(...nextPage.positions)
      last = nextPage.last
    }

    return positions
  }

  private async requestPageWithRenewal(
    page: number,
    token: string,
  ): Promise<{ data: unknown; token: string }> {
    try {
      return { data: await this.requestPageWithRetry(page, token), token }
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error
      }
      const renewed = await this.auth.renewAfterUnauthorized()
      return { data: await this.requestPage(page, renewed), token: renewed }
    }
  }

  // Every attempt builds fresh request IDs and a fresh signature.
  private async requestPageWithRetry(page: number, token: string): Promise<unknown> {
    let attempt = 1
    for (;;) {
      try {
        return await this.requestPage(page, token)
      } catch (error) {
        if (!isTransient(error) || attempt === MAX_ATTEMPTS) {
          throw error
        }
        const status = error instanceof AdapterError ? error.providerStatusCode : undefined
        const backoffMs = Math.min(2 ** attempt * 1000, MAX_BACKOFF_MS)
        logger.info(
          `AMINA positions request failed with provider status ${status}; retrying in ${backoffMs} ms (attempt ${attempt} of ${MAX_ATTEMPTS})`,
        )
        await sleep(backoffMs)
        attempt += 1
      }
    }
  }

  private async requestPage(page: number, token: string): Promise<unknown> {
    const uri = positionsUri(this.settings.AMINA_PORTFOLIO)
    try {
      const { response } = await this.requester.request<unknown>(
        `amina-positions-${this.settings.AMINA_PORTFOLIO}-${page}`,
        {
          baseURL: this.baseURL,
          url: uri,
          params: { page, size: PAGE_SIZE },
          headers: {
            ...requestIds(),
            Authorization: `Bearer ${token}`,
            'User-Agent': USER_AGENT,
            ...signRequest({
              userId: this.settings.AMINA_USER_ID,
              hmacSecret: this.settings.AMINA_HMAC_SECRET,
              agreementNumber: this.settings.AMINA_AGREEMENT_NUMBER,
              uri,
            }),
          },
        },
      )
      return response.data
    } catch (error) {
      throw toProviderError('positions request', error)
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const reserveTransport = new ReserveTransport()
