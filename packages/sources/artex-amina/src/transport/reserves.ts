import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import {
  AdapterRequest,
  AdapterResponse,
  makeLogger,
  sleep,
} from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { utc } from '@date-fns/utc'
import { addDays, addMonths, fromUnixTime, getUnixTime } from 'date-fns'
import { BaseEndpointTypes, inputParameters } from '../endpoint/reserves'
import { AminaSession, getSignedHeaders } from './auth'

const logger = makeLogger('ReservesTransport')

type RequestParams = typeof inputParameters.validated

const PAGE_SIZE = 20

const positionsPath = (portfolio: string): string =>
  `/api/b2c/v1/securities/portfolios/${portfolio}/positions`

type Position = {
  isin?: string
  quantity?: number
}

type PositionsPage = {
  positions?: Position[]
  last?: boolean
  totalPages?: number
}

type PageReply = {
  body: PositionsPage
  date?: string
}

// expiresAt is one calendar month and one day after the report time, in UTC.
const addOneMonthAndOneDay = (unixSeconds: number): number =>
  getUnixTime(addDays(addMonths(fromUnixTime(unixSeconds), 1, { in: utc }), 1, { in: utc }))

export class ReservesTransport extends SubscriptionTransport<BaseEndpointTypes> {
  settings!: BaseEndpointTypes['Settings']
  requester!: Requester
  endpointName!: string
  transportName!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.endpointName = endpointName
    this.transportName = transportName
  }

  // A request against a cold cache fetches the report for itself instead of
  // waiting for the next background execution.
  async foregroundExecute(
    req: AdapterRequest<RequestParams>,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    return this.handleRequest(req.requestContext.data)
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      // The provider error object carries the request, and the request carries
      // the bearer token and the signature: log the message only.
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
    return response
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    // One login serves every page of this report.
    const session = new AminaSession(this.settings, this.requester, (data) =>
      this.httpRequestKey(data),
    )

    const positions: Position[] = []
    let firstPageDate: string | undefined
    for (let page = 0; ; page++) {
      const reply = await this.fetchPage(session, param.portfolio, page)
      if (page === 0) {
        firstPageDate = reply.date
      }

      const body = reply.body
      const last = body?.last
      const totalPages = body?.totalPages
      if (
        !body ||
        !Array.isArray(body.positions) ||
        typeof last !== 'boolean' ||
        typeof totalPages !== 'number' ||
        !Number.isInteger(totalPages)
      ) {
        throw new AdapterError({
          statusCode: 502,
          message: 'AMINA returned a positions page without positions, last and totalPages',
        })
      }
      positions.push(...body.positions)
      if (last) {
        break
      }
      if (page + 1 >= totalPages) {
        throw new AdapterError({
          statusCode: 502,
          message: 'AMINA returned a positions page past the last page it declared',
        })
      }
    }

    const matches = positions.filter((position) => position.isin === param.isin)
    if (matches.length === 0) {
      throw new AdapterError({
        statusCode: 502,
        message: `No AMINA position has the ISIN ${param.isin}`,
      })
    }
    if (matches.length > 1) {
      throw new AdapterError({
        statusCode: 502,
        message: `AMINA returned ${matches.length} positions for the ISIN ${param.isin}`,
      })
    }

    const [match] = matches
    const quantity = match?.quantity
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) {
      throw new AdapterError({
        statusCode: 502,
        message: `The AMINA position for the ISIN ${param.isin} has no usable quantity`,
      })
    }

    const validFromTimestamp = this.unixSecondsOf(firstPageDate, providerDataRequestedUnixMs)

    return {
      data: {
        result: quantity,
        aum: quantity,
        validFromTimestamp,
        observationsTimestamp: validFromTimestamp,
        expiresAt: addOneMonthAndOneDay(validFromTimestamp),
        ripcord: false,
        ripcordAsInt: 0,
      },
      statusCode: 200,
      result: quantity,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }

  private httpRequestKey(data: Record<string, unknown>): string {
    return calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings: this.settings,
        inputParameters,
        endpointName: this.endpointName,
      },
      data,
      transportName: this.transportName,
    })
  }

  // The report time is the reply Date of the first positions page, which is
  // when AMINA made the data; without a usable header it is the adapter clock.
  private unixSecondsOf(dateHeader: string | undefined, requestedAtUnixMs: number): number {
    const headerUnixMs = Date.parse(dateHeader ?? '')
    return getUnixTime(Number.isNaN(headerUnixMs) ? requestedAtUnixMs : headerUnixMs)
  }

  private async fetchPage(
    session: AminaSession,
    portfolio: string,
    page: number,
  ): Promise<PageReply> {
    try {
      return await this.getPage(session, portfolio, page)
    } catch (e) {
      if (!(e instanceof AdapterError) || e.providerStatusCode !== 401) {
        throw e
      }
    }
    await session.renew()
    return this.getPage(session, portfolio, page)
  }

  private async getPage(
    session: AminaSession,
    portfolio: string,
    page: number,
  ): Promise<PageReply> {
    const path = positionsPath(portfolio)
    const params = { page, size: PAGE_SIZE }
    const accessToken = await session.getAccessToken()
    // The request key carries the portfolio: two portfolios of the same page
    // are different provider requests and must not be coalesced.
    const { response } = await this.requester.request<PositionsPage>(
      this.httpRequestKey({ portfolio, ...params }),
      {
        baseURL: this.settings.API_ENDPOINT,
        url: path,
        headers: getSignedHeaders(this.settings, path, accessToken),
        params,
      },
    )
    return { body: response.data, date: response.headers.date }
  }
}

export const reservesTransport = new ReservesTransport()
