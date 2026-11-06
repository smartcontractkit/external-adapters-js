import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getMultiplier } from '../../../src/lib/sourceAdapter'
import { calculatePrice } from '../../../src/price/eaMultiplierPrice'
import { smoothedStreamPrice } from '../../../src/price/smoothedPrice'

jest.mock('../../../src/price/smoothedPrice', () => ({ smoothedStreamPrice: jest.fn() }))
jest.mock('../../../src/lib/sourceAdapter', () => ({ getMultiplier: jest.fn() }))

const mockSmoothedStreamPrice = smoothedStreamPrice as jest.MockedFunction<
  typeof smoothedStreamPrice
>
const mockGetMultiplier = getMultiplier as jest.MockedFunction<typeof getMultiplier>

type MultiplierData = Awaited<ReturnType<typeof getMultiplier>>

describe('calculatePrice', () => {
  const NOW_S = 1_762_387_200
  const NOW_MS = NOW_S * 1000
  const FUTURE_S = NOW_S + 3600
  const PAST_S = NOW_S - 3600

  const requester = {} as Requester

  const params = {
    asset: 'AAPL',
    regularStreamId: 'regular-stream-id',
    extendedStreamId: 'extended-stream-id',
    overnightStreamId: 'overnight-stream-id',
    overnightStreamMaxAgeInSeconds: 60,
    url: 'https://api.example.com',
    tradingHoursUrl: 'https://trading-hours.example.com',
    requester,
    sessionMarket: 'nyse',
    sessionMarketType: '24/5',
    sessionBoundaries: ['09:00', '17:00'],
    sessionBoundariesTimeZone: 'America/New_York',
    smoother: 'kalman' as const,
    decimals: 6,
    sourceAdapter: 'SOLANA_FUNCTIONS',
    sourceAdapterUrl: 'http://solana-functions',
    sourceAdapterParams:
      '{"endpoint":"extension","stateAccountAddress":"6V4gLu7aC63e6CTEJXu71wtx5FMrZ3FQoST7UXXqgPuQ"}',
  }

  const streams = {
    regular: {
      mid: '1',
      lastSeenTimestampNs: '2',
      bid: '0.99',
      bidVolume: 100,
      ask: '1.01',
      askVolume: 100,
      lastTradedPrice: '1.00',
      marketStatus: 1,
      decimals: 18,
    },
    extended: {
      mid: '10',
      lastSeenTimestampNs: '20',
      bid: '9.9',
      bidVolume: 1000,
      ask: '10.1',
      askVolume: 1000,
      lastTradedPrice: '10.0',
      marketStatus: 2,
      decimals: 18,
    },
    overnight: {
      mid: '100',
      lastSeenTimestampNs: '200',
      bid: '99',
      bidVolume: 10000,
      ask: '101',
      askVolume: 10000,
      lastTradedPrice: '100',
      marketStatus: 3,
      decimals: 18,
    },
  }

  const smoothedEntry = (smoother: 'ema' | 'kalman' | 'none', result: bigint) => ({
    result,
    rawPrice: result.toString(),
    decimals: 6,
    stream: streams,
    smoother: {
      smoother,
      price: result.toString(),
      x: '0',
      p: '0',
      secondsFromTransition: 0,
    },
    sessionSource: 'FALLBACK' as const,
  })

  const validMultiplierData = {
    multiplier: 1.5,
    newMultiplier: 2,
    activationDateTime: String(FUTURE_S),
  }

  const mockMultiplier = (data: Record<keyof MultiplierData, unknown>) =>
    mockGetMultiplier.mockResolvedValue(data as MultiplierData)

  let dateNowSpy: jest.SpyInstance<number, []>

  beforeEach(() => {
    jest.clearAllMocks()
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mockSmoothedStreamPrice.mockResolvedValue([
      smoothedEntry('ema', 1_000_000n),
      smoothedEntry('kalman', 2_000_000n),
    ])
    mockMultiplier(validMultiplierData)
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
  })

  it('requests the smoothed price and the multiplier from their sources', async () => {
    await calculatePrice(params)

    expect(mockSmoothedStreamPrice).toHaveBeenCalledTimes(1)
    expect(mockSmoothedStreamPrice).toHaveBeenCalledWith(params)

    expect(mockGetMultiplier).toHaveBeenCalledTimes(1)
    expect(mockGetMultiplier).toHaveBeenCalledWith(
      params.sourceAdapter,
      params.sourceAdapterUrl,
      params.sourceAdapterParams,
      requester,
    )
  })

  it('scales every smoother entry by the current multiplier when activation is in the future', async () => {
    const result = await calculatePrice(params)

    const expectedMultiplierFields = {
      currentMultiplier: 1.5,
      newMultiplier: 2,
      activationDateTime: FUTURE_S,
      scaledUiAmount: {
        multiplier: '1500000000000000000',
        newMultiplier: '2000000000000000000',
        newMultiplierEffectiveTimestamp: FUTURE_S,
      },
    }

    expect(result).toStrictEqual([
      {
        ...smoothedEntry('ema', 1_000_000n),
        ...expectedMultiplierFields,
        result: '1500000',
      },
      {
        ...smoothedEntry('kalman', 2_000_000n),
        ...expectedMultiplierFields,
        result: '3000000',
      },
    ])
  })

  it('scales by newMultiplier once activation has passed', async () => {
    mockMultiplier({ ...validMultiplierData, activationDateTime: String(PAST_S) })

    const result = await calculatePrice(params)

    expect(result[0]).toMatchObject({
      currentMultiplier: 2,
      newMultiplier: 2,
      activationDateTime: PAST_S,
      scaledUiAmount: {
        multiplier: '1500000000000000000',
        newMultiplier: '2000000000000000000',
        newMultiplierEffectiveTimestamp: PAST_S,
      },
      result: '2000000',
    })
    expect(result[1].result).toBe('4000000')
  })

  it('scales by newMultiplier when activation is exactly now', async () => {
    mockMultiplier({ ...validMultiplierData, activationDateTime: String(NOW_S) })

    const result = await calculatePrice(params)

    expect(result[0]).toMatchObject({ currentMultiplier: 2, result: '2000000' })
  })

  it('still scales by multiplier one second before activation', async () => {
    mockMultiplier({ ...validMultiplierData, activationDateTime: String(NOW_S + 1) })

    const result = await calculatePrice(params)

    expect(result[0]).toMatchObject({ currentMultiplier: 1.5, result: '1500000' })
  })

  it('accepts a numeric activationDateTime', async () => {
    mockMultiplier({ ...validMultiplierData, activationDateTime: PAST_S })

    const result = await calculatePrice(params)

    expect(result[0]).toMatchObject({
      currentMultiplier: 2,
      activationDateTime: PAST_S,
      scaledUiAmount: expect.objectContaining({ newMultiplierEffectiveTimestamp: PAST_S }),
      result: '2000000',
    })
  })

  it('keeps 18 decimals of multiplier precision when scaling', async () => {
    mockSmoothedStreamPrice.mockResolvedValue([smoothedEntry('none', 1_000_000_000_000n)])
    mockMultiplier({ ...validMultiplierData, multiplier: 1.000000000001 })

    const result = await calculatePrice({ ...params, smoother: 'none' })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      currentMultiplier: 1.000000000001,
      scaledUiAmount: expect.objectContaining({ multiplier: '1000000000001000000' }),
      result: '1000000000001',
    })
  })

  it('truncates fractional scaled results toward zero', async () => {
    mockSmoothedStreamPrice.mockResolvedValue([
      smoothedEntry('ema', 3n),
      smoothedEntry('kalman', 1n),
    ])
    mockMultiplier({ ...validMultiplierData, multiplier: 0.5 })

    const result = await calculatePrice(params)

    expect(result[0].result).toBe('1')
    expect(result[1].result).toBe('0')
  })

  it('throws 503 when multiplier is zero', async () => {
    mockMultiplier({ ...validMultiplierData, multiplier: 0 })

    const thrown = await calculatePrice(params).catch((e) => e)

    expect(thrown).toBeInstanceOf(AdapterError)
    expect(thrown).toMatchObject({
      statusCode: 503,
      message: 'Non-positive 0 or 2 for asset: AAPL',
    })
  })

  it('throws 503 when multiplier is negative', async () => {
    mockMultiplier({ ...validMultiplierData, multiplier: -1 })

    await expect(calculatePrice(params)).rejects.toMatchObject({
      statusCode: 503,
      message: 'Non-positive -1 or 2 for asset: AAPL',
    })
  })

  it.each([
    ['multiplier', undefined],
    ['multiplier', null],
    ['multiplier', NaN],
    ['multiplier', ''],
    ['multiplier', 'abc'],
    ['multiplier', true],
    ['newMultiplier', undefined],
    ['newMultiplier', NaN],
    ['newMultiplier', Infinity],
    ['newMultiplier', '1.5x'],
    ['activationDateTime', undefined],
    ['activationDateTime', null],
    ['activationDateTime', ''],
    ['activationDateTime', '   '],
    ['activationDateTime', 'tomorrow'],
    ['activationDateTime', -Infinity],
  ] as const)('throws 503 when %s is %p', async (field, value) => {
    mockMultiplier({ ...validMultiplierData, [field]: value })

    await expect(calculatePrice(params)).rejects.toMatchObject({
      statusCode: 503,
      message: `Invalid ${field} value ${value} for asset: AAPL`,
    })
  })

  it('reports multiplier first when several values are invalid', async () => {
    mockMultiplier({ multiplier: 'abc', newMultiplier: NaN, activationDateTime: '' })

    await expect(calculatePrice(params)).rejects.toMatchObject({
      statusCode: 503,
      message: 'Invalid multiplier value abc for asset: AAPL',
    })
  })

  it('reports an invalid multiplier before checking its sign', async () => {
    mockMultiplier({ ...validMultiplierData, multiplier: NaN })

    await expect(calculatePrice(params)).rejects.toMatchObject({
      statusCode: 503,
      message: 'Invalid multiplier value NaN for asset: AAPL',
    })
  })

  it('propagates errors from the source adapter', async () => {
    const error = new AdapterError({ statusCode: 504, message: 'timed out' })
    mockGetMultiplier.mockRejectedValue(error)

    await expect(calculatePrice(params)).rejects.toBe(error)
  })

  it('propagates errors from the smoothed stream price', async () => {
    const error = new AdapterError({ statusCode: 502, message: 'no stream data' })
    mockSmoothedStreamPrice.mockRejectedValue(error)

    await expect(calculatePrice(params)).rejects.toBe(error)
  })
})
