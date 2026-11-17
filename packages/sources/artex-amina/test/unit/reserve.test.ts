import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../../src/endpoint/reserve'
import { parsePositionsPage, ReserveTransport } from '../../src/transport/reserve'
import { AMINA_HOST, authBody, ISIN, page, pageMetadata, position } from '../fixtures/amina'

const noop = () => undefined
LoggerFactoryProvider.set({
  child: () => ({
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    msgPrefix: 'test',
  }),
})

const captureError = (fn: () => void): AdapterError => {
  try {
    fn()
  } catch (error) {
    return error as AdapterError
  }
  throw new Error('expected the call to throw')
}

describe('ReserveTransport', () => {
  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: AMINA_HOST,
    AMINA_USER_ID: '12345678',
    AMINA_PASSWORD: 'super-secret-password',
    AMINA_HMAC_SECRET: 'super-secret-hmac',
    AMINA_AGREEMENT_NUMBER: '123456-1',
    AMINA_PORTFOLIO: '157769305',
    AMINA_ISIN: ISIN,
    BACKGROUND_EXECUTE_MS: 1000,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    // The production defaults, so the retry budget never trips here.
    API_TIMEOUT: 60_000,
    BACKGROUND_EXECUTE_TIMEOUT: 180_000,
  } as unknown as BaseEndpointTypes['Settings'])

  const requester = { request: jest.fn() }
  const responseCache = { write: jest.fn() }
  const subscriptionSetFactory = { buildSet: jest.fn() }
  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory,
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: ReserveTransport

  const respondWithPage = (pageBody: unknown) => {
    requester.request.mockImplementation((_key: string, config: { url: string }) =>
      Promise.resolve({
        response: {
          data: config.url === '/api/b2c/v1/auth' ? authBody() : pageBody,
        },
      }),
    )
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    transport = new ReserveTransport()
    await transport.initialize(dependencies, adapterSettings, 'reserve', 'default_single_transport')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('publishes a quantity with more than four decimal places at four decimal places', async () => {
    respondWithPage(page({ positions: [position({ quantity: 1.23456 })] }))

    const response = await transport._handleRequest()

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe(1.2346)
    expect(response.data).toEqual({ result: 1.2346, ripcord: false })
  })

  it('publishes a zero quantity as a valid reserve', async () => {
    respondWithPage(page({ positions: [position({ quantity: 0 })] }))

    const response = await transport._handleRequest()

    expect(response.statusCode).toBe(200)
    expect(response.result).toBe(0)
    expect(response.data).toEqual({ result: 0, ripcord: false })
  })

  it('waits the empty-pass interval when there is nothing to read', async () => {
    jest.useFakeTimers()
    let settled = false

    const pass = transport
      .backgroundHandler({ adapterSettings: { BACKGROUND_EXECUTE_MS_HTTP: 250 } } as never, [])
      .then(() => {
        settled = true
      })

    await jest.advanceTimersByTimeAsync(249)
    expect(settled).toBe(false)

    await jest.advanceTimersByTimeAsync(1)
    await pass
    expect(settled).toBe(true)
  })

  it('waits the entry-pass interval after handling a subscription', async () => {
    respondWithPage(page({ positions: [position({ quantity: 5 })] }))
    jest.useFakeTimers()
    let settled = false

    const pass = transport
      .backgroundHandler({ adapterSettings: { BACKGROUND_EXECUTE_MS: 1000 } } as never, [{}])
      .then(() => {
        settled = true
      })

    await jest.advanceTimersByTimeAsync(999)
    expect(settled).toBe(false)

    await jest.advanceTimersByTimeAsync(1)
    await pass
    expect(settled).toBe(true)
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  })
})

describe('parsePositionsPage', () => {
  it.each([
    { name: 'the body is null', body: null, message: 'the body is not an object' },
    { name: 'the body is an array', body: [], message: 'the body is not an object' },
    {
      name: 'totalPages is a string',
      body: page({ totalPages: '1' }),
      message: 'totalPages is not a non-negative integer',
    },
    {
      name: 'totalPages is negative',
      body: page({ totalPages: -1 }),
      message: 'totalPages is not a non-negative integer',
    },
    {
      name: 'totalPages is fractional',
      body: page({ totalPages: 1.5 }),
      message: 'totalPages is not a non-negative integer',
    },
    {
      name: 'totalElements is a string',
      body: page({ totalElements: '1' }),
      message: 'totalElements is not a non-negative integer',
    },
    {
      name: 'totalElements is negative',
      body: page({ totalElements: -1 }),
      message: 'totalElements is not a non-negative integer',
    },
    {
      name: 'totalElements is fractional',
      body: page({ totalElements: 1.5 }),
      message: 'totalElements is not a non-negative integer',
    },
    {
      name: 'size is zero',
      body: page({ size: 0 }),
      message: 'size is not a positive integer',
    },
    {
      name: 'size is a string',
      body: page({ size: '20' }),
      message: 'size is not a positive integer',
    },
    {
      name: 'first is not a boolean',
      body: page({ first: 'true' }),
      message: 'first is not a boolean',
    },
    {
      name: 'the page number is not the requested page',
      body: page({ number: 1 }),
      message: 'does not match the requested page',
    },
    {
      name: 'positions is not an array',
      body: page({ positions: 'none' }),
      message: 'positions is not an array',
    },
    {
      name: 'last is not a boolean',
      body: page({ last: 'true' }),
      message: 'last is not a boolean',
    },
    {
      name: 'a position has no string isin',
      body: page({ positions: [{ quantity: 1 }] }),
      message: 'positions[0].isin is not a string',
    },
    {
      name: 'a position quantity is not a number',
      body: page({ positions: [position({ quantity: '1' })] }),
      message: 'positions[0].quantity is not a finite number',
    },
  ])('rejects a page when $name', ({ body, message }) => {
    const error = captureError(() => parsePositionsPage(body, 0))

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.statusCode).toBe(502)
    expect(error.message).toContain(message)
  })

  it.each([
    {
      name: 'totalPages contradicts totalElements and size',
      body: page({ totalPages: 1_000_000_000 }),
      pageNumber: 0,
      message: 'totalPages is 1000000000 but totalElements 1 and size 20 give 1',
    },
    {
      name: 'first is true on page 1',
      body: page({ ...pageMetadata(1, 2, 21), first: true }),
      pageNumber: 1,
      message: 'first is true on page 1',
    },
    {
      name: 'a page holds more positions than its size',
      body: page({
        positions: Array.from({ length: 21 }, (_, index) => position({ quantity: index })),
        totalPages: 1,
        totalElements: 21,
        size: 20,
        first: true,
        last: true,
      }),
      pageNumber: 0,
      message: 'positions has 21 entries but size is 20',
    },
    {
      name: 'totalPages is zero but positions is not empty',
      body: page({ positions: [position()], ...pageMetadata(0, 0, 0) }),
      pageNumber: 0,
      message: 'totalPages is 0 but positions is not empty',
    },
  ])(
    'rejects page metadata that contradicts the declared totals when $name',
    ({ body, pageNumber, message }) => {
      const error = captureError(() => parsePositionsPage(body, pageNumber))

      expect(error).toBeInstanceOf(AdapterError)
      expect(error.statusCode).toBe(502)
      expect(error.message).toContain(message)
    },
  )

  it('rejects a page whose position element is not an object', () => {
    const error = captureError(() => parsePositionsPage(page({ positions: [null] }), 0))

    expect(error).toBeInstanceOf(AdapterError)
    expect(error.statusCode).toBe(502)
    expect(error.message).toContain('positions[0]')
    expect(error.message).toContain('not an object')
  })
})
