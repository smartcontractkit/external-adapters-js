import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/reserves'
import { ReservesTransport } from '../../src/transport/reserves'
import {
  AGREEMENT_NUMBER,
  API_HOST,
  BAD_LAST_PAGE,
  BAD_TOTAL_PAGES_PAGE,
  DATE_HEADER,
  FIRST_OF_TWO_PAGE,
  HMAC_SECRET,
  LAST_FALSE_AT_END_PAGE,
  LAST_FALSE_ON_LAST_PAGE,
  LOGIN_BODY,
  MATCHING_ISIN,
  MISSING_LAST_PAGE,
  MISSING_POSITIONS_PAGE,
  MISSING_TOTAL_PAGES_PAGE,
  NEGATIVE_PAGE,
  NON_ARRAY_POSITIONS_PAGE,
  NULL_QUANTITY_PAGE,
  ONE_MATCH_PAGE,
  PASSWORD,
  SECOND_OF_TWO_PAGE,
  STRING_QUANTITY_PAGE,
  USER_ID,
  ZERO_PAGE,
} from '../fixtures'

const NOW = 1773100800000
const PORTFOLIO = '999888777'

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
  msgPrefix: 'test',
}
const loggerFactory = { child: () => logger }
LoggerFactoryProvider.set(loggerFactory)

type RequestParams = typeof inputParameters.validated

type PageReply = {
  body: object
  date?: string
}

type LoadedTransport = {
  transport: ReservesTransport
  requester: { request: jest.Mock }
  responseCache: { write: jest.Mock }
}

type Outcome = {
  statusCode?: number
  errorMessage?: string
  result?: unknown
  data?: unknown
  timestamps?: unknown
}

const adapterSettings = {
  API_ENDPOINT: API_HOST,
  AMINA_USER_ID: USER_ID,
  AMINA_PASSWORD: PASSWORD,
  AMINA_HMAC_SECRET: HMAC_SECRET,
  AMINA_AGREEMENT_NUMBER: AGREEMENT_NUMBER,
  BACKGROUND_EXECUTE_MS: 100_000,
  WARMUP_SUBSCRIPTION_TTL: 100_000,
  API_TIMEOUT: 60_000,
  RETRY: 0,
  MAX_COMMON_KEY_SIZE: 300,
} as unknown as BaseEndpointTypes['Settings']

const params = {
  portfolio: PORTFOLIO,
  isin: MATCHING_ISIN,
} as unknown as RequestParams

const loadTransport = async (pages: PageReply[], now = NOW): Promise<LoadedTransport> => {
  jest.spyOn(Date, 'now').mockReturnValue(now)

  const queuedPages = [...pages]
  const requester = {
    request: jest.fn(async (_key: string, requestConfig: { url?: string }) => {
      const url = requestConfig.url ?? ''
      if (url.includes('/auth')) {
        return {
          response: { data: LOGIN_BODY, status: 200, headers: {} },
          timestamps: {
            providerDataRequestedUnixMs: now,
            providerDataReceivedUnixMs: now,
          },
        }
      }

      const page = queuedPages.shift()
      if (!page) {
        throw new Error('the adapter requested an unexpected positions page')
      }
      return {
        response: {
          data: page.body,
          status: 200,
          headers: { date: page.date ?? DATE_HEADER },
        },
        timestamps: {
          providerDataRequestedUnixMs: now,
          providerDataReceivedUnixMs: now,
        },
      }
    }),
  }

  const responseCache = { write: jest.fn() }
  const dependencies = {
    requester,
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(() => ({ add: jest.fn(), getAll: jest.fn() })),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>

  const transport = new ReservesTransport()
  await transport.initialize(dependencies, adapterSettings, 'reserves', 'default_single_transport')
  return { transport, requester, responseCache }
}

const responseOf = async ({ transport, responseCache }: LoadedTransport): Promise<Outcome> => {
  await transport.handleRequest(params)
  const lastCall = responseCache.write.mock.calls[responseCache.write.mock.calls.length - 1]
  const entries = lastCall?.[1] as { response: Outcome }[] | undefined
  if (!entries?.[0]) {
    throw new Error('the transport did not write a response to the cache')
  }
  return entries[0].response
}

const messageOf = (outcome: Outcome): string => String(outcome.errorMessage)

const expectUnusable = (outcome: Outcome): void => {
  expect(outcome.statusCode).toBe(502)
  expect(outcome.result).toBeUndefined()
  expect(outcome.data).toBeUndefined()
  expect(messageOf(outcome)).toBeTruthy()
}

describe('ReservesTransport', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('publishes the position quantity and the v9 fields, not another numeric field', async () => {
    const loaded = await loadTransport([{ body: ONE_MATCH_PAGE }])

    const response = await responseOf(loaded)

    expect(response).toEqual({
      statusCode: 200,
      result: 123.4567,
      data: {
        result: 123.4567,
        aum: 123.4567,
        validFromTimestamp: 1773100800,
        observationsTimestamp: 1773100800,
        expiresAt: 1775865600,
        ripcord: false,
        ripcordAsInt: 0,
      },
      timestamps: {
        providerDataRequestedUnixMs: NOW,
        providerDataReceivedUnixMs: NOW,
      },
    })
  })

  it('publishes the first page date in Unix seconds and the envelope in Unix milliseconds', async () => {
    const clockBeforeGet = 1773099999000
    const loaded = await loadTransport([{ body: ONE_MATCH_PAGE }], clockBeforeGet)

    const response = await responseOf(loaded)

    expect(response.statusCode).toBe(200)
    expect(response.data).toMatchObject({
      validFromTimestamp: 1773100800,
      observationsTimestamp: 1773100800,
      expiresAt: 1775865600,
    })
    expect(response.timestamps).toMatchObject({
      providerDataRequestedUnixMs: clockBeforeGet,
      providerDataReceivedUnixMs: clockBeforeGet,
    })
  })

  describe('the pagination decision', () => {
    const cases: {
      name: string
      pages: PageReply[]
      statusCode: number
      pageRequests: number
    }[] = [
      {
        name: 'stops on a last page that is the only page',
        pages: [{ body: ONE_MATCH_PAGE }],
        statusCode: 200,
        pageRequests: 1,
      },
      {
        name: 'reads the next page when last is false and the page number is below totalPages',
        pages: [{ body: FIRST_OF_TWO_PAGE }, { body: SECOND_OF_TWO_PAGE }],
        statusCode: 200,
        pageRequests: 2,
      },
      {
        name: 'rejects last false on the declared last page',
        pages: [{ body: LAST_FALSE_AT_END_PAGE }],
        statusCode: 502,
        pageRequests: 1,
      },
      {
        name: 'rejects last false on a page after the declared last page',
        pages: [{ body: FIRST_OF_TWO_PAGE }, { body: LAST_FALSE_ON_LAST_PAGE }],
        statusCode: 502,
        pageRequests: 2,
      },
    ]

    it.each(cases)('$name', async ({ pages, statusCode, pageRequests }) => {
      const loaded = await loadTransport(pages)

      const response = await responseOf(loaded)

      expect(response.statusCode).toBe(statusCode)
      if (statusCode === 200) {
        expect(response.result).toBe(123.4567)
      } else {
        expect(response.result).toBeUndefined()
        expect(response.data).toBeUndefined()
      }
      expect(loaded.requester.request).toHaveBeenCalledTimes(1 + pageRequests)
    })
  })

  it('accepts a zero quantity as a valid reserve', async () => {
    const loaded = await loadTransport([{ body: ZERO_PAGE }])

    const response = await responseOf(loaded)

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe(0)
    expect(response.data).toMatchObject({ result: 0, aum: 0, ripcord: false })
  })

  it('rejects a negative quantity as unusable data', async () => {
    const loaded = await loadTransport([{ body: NEGATIVE_PAGE }])

    const response = await responseOf(loaded)

    expect(loaded.requester.request).toHaveBeenCalledTimes(2)
    expectUnusable(response)
  })

  describe('a quantity that is not a number', () => {
    it.each([
      { name: 'null', page: NULL_QUANTITY_PAGE },
      { name: 'a numeric string', page: STRING_QUANTITY_PAGE },
    ])('rejects $name as unusable data', async ({ page }) => {
      const loaded = await loadTransport([{ body: page }])

      const response = await responseOf(loaded)

      expect(loaded.requester.request).toHaveBeenCalledTimes(2)
      expectUnusable(response)
    })
  })

  describe('an unusable positions page', () => {
    it.each([
      { name: 'positions absent', page: MISSING_POSITIONS_PAGE },
      { name: 'positions not an array', page: NON_ARRAY_POSITIONS_PAGE },
      { name: 'last absent', page: MISSING_LAST_PAGE },
      { name: 'last not a boolean', page: BAD_LAST_PAGE },
      { name: 'totalPages absent', page: MISSING_TOTAL_PAGES_PAGE },
      { name: 'totalPages not an integer', page: BAD_TOTAL_PAGES_PAGE },
    ])('rejects $name with a 502', async ({ page }) => {
      const loaded = await loadTransport([{ body: page }])

      const response = await responseOf(loaded)

      expect(loaded.requester.request).toHaveBeenCalledTimes(2)
      expectUnusable(response)
    })
  })
})
