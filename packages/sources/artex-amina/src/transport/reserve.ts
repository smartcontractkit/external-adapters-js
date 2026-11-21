import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserve'
import { AminaAuth, requestIds, signRequest, toProviderError } from './authentication'

const logger = makeLogger('ArtexAminaReserveTransport')

const PAGE_SIZE = 20
const QUANTITY_DECIMALS = 4
const USER_AGENT = 'chainlink-artex-amina-adapter'
const BUDGET_MARGIN_MS = 1_000

type RequestParams = typeof inputParameters.validated

interface PositionSchema {
  isin: string
  quantity: number
}

interface PositionsResponseSchema {
  positions: PositionSchema[]
  totalPages: number
  totalElements: number
  size: number
  last: boolean
}

const positionsUri = (portfolio: string): string =>
  `/api/b2c/v1/securities/portfolios/${portfolio}/positions`

const unusable = (message: string): AdapterError =>
  new AdapterError({
    statusCode: 502,
    message: `AMINA positions response is unusable: ${message}`,
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]'
const isInteger = (value: unknown): value is number => Number.isInteger(value)
const isFiniteNumber = (value: unknown): value is number => Number.isFinite(value)
const isBoolean = (value: unknown): value is boolean => value === true || value === false

export const parsePositionsPage = (
  data: unknown,
  expectedPage: number,
): PositionsResponseSchema => {
  if (!isRecord(data)) throw unusable('the body is not an object')

  const totalPages = data.totalPages
  const totalElements = data.totalElements
  const size = data.size
  const first = data.first
  const last = data.last

  if (!isInteger(totalPages) || totalPages < 0) {
    throw unusable('totalPages is not a non-negative integer')
  }
  if (!isInteger(totalElements) || totalElements < 0) {
    throw unusable('totalElements is not a non-negative integer')
  }
  if (!isInteger(size) || size < 1) throw unusable('size is not a positive integer')
  if (!isBoolean(first)) throw unusable('first is not a boolean')
  if (data.number !== expectedPage) {
    throw unusable(`page ${String(data.number)} is not ${expectedPage}`)
  }
  if (!Array.isArray(data.positions)) throw unusable('positions is not an array')
  if (data.positions.length > size) {
    throw unusable(`positions has ${data.positions.length} entries but size is ${size}`)
  }
  if (totalPages === 0 && data.positions.length !== 0) {
    throw unusable('totalPages is 0 but positions is not empty')
  }
  const expectedTotalPages = Math.ceil(totalElements / size)
  if (totalPages !== expectedTotalPages) {
    throw unusable(
      `totalPages is ${totalPages} but totalElements ${totalElements} and size ${size} give ${expectedTotalPages}`,
    )
  }
  if (first !== (expectedPage === 0)) throw unusable(`first is ${first} on page ${expectedPage}`)
  if (!isBoolean(last)) throw unusable('last is not a boolean')
  const isLastPage = totalPages === 0 ? true : expectedPage + 1 === totalPages
  if (last !== isLastPage) {
    throw unusable(`last ${last} contradicts page ${expectedPage} of ${totalPages}`)
  }

  const positions = data.positions.map((position, index) => {
    if (!isRecord(position)) throw unusable(`positions[${index}] is not an object`)
    const isin = position.isin
    const quantity = position.quantity
    if (typeof isin !== 'string') {
      throw unusable(`positions[${index}].isin is not a string`)
    }
    if (!isFiniteNumber(quantity)) {
      throw unusable(`positions[${index}].quantity is not a finite number`)
    }
    return { isin, quantity }
  })

  return { positions, totalPages, totalElements, size, last }
}

const isUnauthorized = (error: unknown): boolean =>
  error instanceof AdapterError && error.providerStatusCode === 401

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
    // The measured background execute includes the post-pass sleep, so reserve it.
    const deadline =
      Date.now() +
      this.settings.BACKGROUND_EXECUTE_TIMEOUT -
      this.settings.BACKGROUND_EXECUTE_MS -
      BUDGET_MARGIN_MS
    const token = await this.auth.getAccessToken()
    const providerDataRequestedUnixMs = Date.now()
    const positions = await this.fetchPositions(token, deadline)
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

  async fetchPositions(token: string, deadline: number): Promise<PositionSchema[]> {
    this.assertBudget(deadline)
    const first = await this.requestPageWithRenewal(0, token, deadline)
    let currentToken = first.token
    const firstPage = parsePositionsPage(first.data, 0)
    const positions = [...firstPage.positions]

    let page = 0
    let last = firstPage.last
    while (!last) {
      page += 1
      this.assertBudget(deadline)
      const next = await this.requestPageWithRenewal(page, currentToken, deadline)
      currentToken = next.token
      const nextPage = parsePositionsPage(next.data, page)
      if (
        nextPage.totalPages !== firstPage.totalPages ||
        nextPage.totalElements !== firstPage.totalElements ||
        nextPage.size !== firstPage.size
      ) {
        throw unusable('page metadata changed after page 0')
      }
      positions.push(...nextPage.positions)
      last = nextPage.last
    }

    if (positions.length !== firstPage.totalElements) {
      throw unusable(`expected ${firstPage.totalElements} positions, received ${positions.length}`)
    }

    return positions
  }

  private assertBudget(deadline: number): void {
    if (Date.now() + this.settings.API_TIMEOUT > deadline) {
      throw new AdapterError({
        statusCode: 502,
        message:
          'AMINA background execution budget is exhausted before the positions request completed',
      })
    }
  }

  private async requestPageWithRenewal(
    page: number,
    token: string,
    deadline: number,
  ): Promise<{ data: unknown; token: string }> {
    try {
      return { data: await this.requestPage(page, token), token }
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error
      }
      const renewed = await this.auth.renewAfterUnauthorized()
      this.assertBudget(deadline)
      return { data: await this.requestPage(page, renewed), token: renewed }
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
