import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { buildQuoteTransport, invalidPairs } from '../../src/transport/stock_quotes'

LoggerFactoryProvider.set()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleMessage = (message: unknown): any =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (buildQuoteTransport() as any).config.handlers.message(message)

const T = 1762819200000 // 2026-11-11T00:00:00Z
const PAIR = 'Equity:US:AAPL/USD'
const params = { base: 'Equity:US:AAPL', quote: 'USD' }

const quoteFrame = (overrides: Record<string, unknown> = {}) => ({
  k: 'quote',
  c: PAIR,
  s: 'AAPL/USD',
  m: '100.5',
  b: '100',
  a: '101',
  bv: '10',
  av: '20',
  lp: '100.25',
  t: String(T),
  ...overrides,
})

const valueFrame = (overrides: Record<string, unknown> = {}) => ({
  k: 'value',
  c: 'Index:US:SPX/USD',
  s: 'SPX/USD',
  v: '5000.5',
  t: String(T),
  ...overrides,
})

const without = (frame: Record<string, unknown>, ...keys: string[]) => {
  const copy = { ...frame }
  keys.forEach((key) => delete copy[key])
  return copy
}

const expectDropped = (message: unknown) => {
  expect(handleMessage(message)).toBeUndefined()
}

// Values that count as a missing field
const missingPrices: [string, unknown][] = [
  ['missing', undefined],
  ['null', null],
  ['empty string', ''],
  ['whitespace', '   '],
]

// Present values that must never be accepted as a price
const invalidPrices: [string, unknown][] = [
  ['zero', '0'],
  ['zero with decimals', '0.00'],
  ['negative', '-1.5'],
  ['text', 'abc'],
  ['number with trailing text', '100abc'],
  ['comma decimal', '100,5'],
  ['thousands separator', '1,000.5'],
  ['hex', '0x10'],
  ['upper case hex', '0X10'],
  ['binary', '0b101'],
  ['octal', '0o17'],
  ['leading plus', '+100'],
  ['inner whitespace', '1 000'],
  ['NaN', 'NaN'],
  ['Infinity', 'Infinity'],
  ['numeric zero', 0],
  ['numeric negative', -1],
  ['numeric NaN', NaN],
  ['numeric Infinity', Infinity],
  ['boolean', true],
  ['object', { value: 1 }],
  ['array', ['100']],
]

// Values that must never be accepted as a volume (zero is a valid volume)
const invalidVolumes: [string, unknown][] = [
  ['missing', undefined],
  ['null', null],
  ['empty string', ''],
  ['whitespace', ' '],
  ['negative', '-1'],
  ['text', 'abc'],
  ['hex', '0x10'],
  ['binary', '0b1'],
  ['octal', '0o7'],
  ['leading plus', '+1'],
  ['NaN', 'NaN'],
  ['Infinity', 'Infinity'],
  ['boolean', true],
  ['object', {}],
]

const invalidTimestamps: [string, unknown][] = [
  ['empty string', ''],
  ['text', 'abc'],
  ['ISO date', '2026-11-11T00:00:00Z'],
  ['zero', '0'],
  ['negative', '-1'],
  ['seconds instead of milliseconds', '1762819200'],
  ['microseconds instead of milliseconds', '1762819200000000'],
  ['NaN', 'NaN'],
  ['Infinity', 'Infinity'],
  ['hex', '0x19a6b2f6800'],
  ['leading plus', `+${T}`],
  ['last ms of year 2000', String(Date.UTC(2001, 0, 1) - 1)],
  ['first ms of year 2100', String(Date.UTC(2100, 0, 1))],
  ['beyond the Date range', '9e15'],
]

describe('stock_quotes transport message handler', () => {
  beforeEach(() => {
    invalidPairs.clear()
  })

  describe('message routing', () => {
    it.each([
      ['empty object', {}],
      ['subscription ack', { result: 'subscribed' }],
      ['unrelated error message', { message: 'rate limit exceeded' }],
      ['missing c', without(quoteFrame(), 'c')],
      ['empty c', quoteFrame({ c: '' })],
      ['missing k', without(quoteFrame(), 'k')],
      ['empty k', quoteFrame({ k: '' })],
      ['unknown k', quoteFrame({ k: 'trade' })],
    ])('ignores %s', (_, message) => {
      expectDropped(message)
    })

    it.each([
      ['no slash', 'Equity:US:AAPL'],
      ['empty quote', 'Equity:US:AAPL/'],
      ['empty base', '/USD'],
    ])('rejects a frame whose c has %s', (_, c) => {
      expectDropped(quoteFrame({ c }))
    })

    it.each(['quote', 'QUOTE', 'Quote'])('handles k = %s as a quote frame', (k) => {
      const result = handleMessage(quoteFrame({ k }))
      expect(result).toHaveLength(2)
      expect(result[0].response.result).toBe(100.25)
    })

    it.each(['value', 'VALUE', 'Value'])('handles k = %s as a value frame', (k) => {
      const result = handleMessage(valueFrame({ k }))
      expect(result).toHaveLength(2)
      expect(result[1].response.result).toBe(5000.5)
    })

    it('normalises the casing of market, ticker and quote from c', () => {
      const result = handleMessage(quoteFrame({ c: 'Equity:us:aapl/usd' }))
      expect(result.map((r: { params: unknown }) => r.params)).toEqual([
        { ...params, requireVolume: false },
        { ...params, requireVolume: true },
      ])
    })

    it('uses c rather than s to identify the pair', () => {
      const result = handleMessage(quoteFrame({ c: 'ETF:US:SPY/USD', s: 'AAPL/USD' }))
      expect(result[0].params).toEqual({ base: 'ETF:US:SPY', quote: 'USD', requireVolume: false })
    })

    it('splits c on the first slash only and keeps the rest as the quote', () => {
      const result = handleMessage(quoteFrame({ c: 'Equity:us:aapl/usd/t' }))
      expect(result.map((r: { params: unknown }) => r.params)).toEqual([
        { base: 'Equity:US:AAPL', quote: 'USD/T', requireVolume: false },
        { base: 'Equity:US:AAPL', quote: 'USD/T', requireVolume: true },
      ])
    })

    it('does not need the pair not found prefix to parse c', () => {
      const result = handleMessage(valueFrame({ c: 'Index:kr:kospi200/krw' }))
      expect(result[1].params).toEqual({
        base: 'Index:KR:KOSPI200',
        quote: 'KRW',
        requireVolume: false,
      })
    })
  })

  describe('pair not found messages', () => {
    const response = {
      statusCode: 502,
      errorMessage: 'The requested pair does not exist, is inactive, or is suspended.',
    }

    it('returns a 502 for both requireVolume variants and blocks the pair', () => {
      const result = handleMessage({ message: 'pair not found: Equity:US:FAKE/USD' })

      expect(result).toEqual([
        { params: { base: 'Equity:US:FAKE', quote: 'USD', requireVolume: true }, response },
        { params: { base: 'Equity:US:FAKE', quote: 'USD', requireVolume: false }, response },
      ])
      expect(Array.from(invalidPairs)).toEqual(['Equity:US:FAKE/USD'])
    })

    it('normalises the casing of the pair in the error message', () => {
      const result = handleMessage({ message: 'pair not found: Equity:us:fake/usd' })

      expect(result[0].params).toEqual({
        base: 'Equity:US:FAKE',
        quote: 'USD',
        requireVolume: true,
      })
      expect(Array.from(invalidPairs)).toEqual(['Equity:US:FAKE/USD'])
    })

    it('splits the pair on the first slash only and keeps the rest as the quote', () => {
      const result = handleMessage({ message: 'pair not found: Equity:us:fake/usd/t' })

      expect(result).toEqual([
        { params: { base: 'Equity:US:FAKE', quote: 'USD/T', requireVolume: true }, response },
        { params: { base: 'Equity:US:FAKE', quote: 'USD/T', requireVolume: false }, response },
      ])
      expect(Array.from(invalidPairs)).toEqual(['Equity:US:FAKE/USD/T'])
    })

    it('takes precedence over quote fields in the same message', () => {
      const result = handleMessage(quoteFrame({ message: `pair not found: ${PAIR}` }))

      expect(result.map((r: { response: unknown }) => r.response)).toEqual([response, response])
      expect(invalidPairs.has(PAIR)).toBe(true)
    })

    it.each([
      ['no pair', 'pair not found: '],
      ['no slash', 'pair not found: Equity:US:FAKE'],
      ['empty quote', 'pair not found: Equity:US:FAKE/'],
      ['empty base', 'pair not found: /USD'],
    ])('rejects a message with %s without blocking anything', (_, message) => {
      expectDropped({ message })
      expect(invalidPairs.size).toBe(0)
    })

    it('does not treat a message that merely contains the phrase as pair not found', () => {
      expectDropped({ message: `error: pair not found: ${PAIR}` })
      expect(invalidPairs.size).toBe(0)
    })
  })

  describe('quote frames', () => {
    const data = {
      mid_price: 100.5,
      bid_price: 100,
      bid_volume: 10,
      ask_price: 101,
      ask_volume: 20,
      last_price: 100.25,
    }

    it('returns the same response for both requireVolume variants', () => {
      const response = {
        result: 100.25,
        data,
        timestamps: { providerIndicatedTimeUnixMs: T },
      }

      expect(handleMessage(quoteFrame())).toEqual([
        { params: { ...params, requireVolume: false }, response },
        { params: { ...params, requireVolume: true }, response },
      ])
    })

    it('accepts numeric fields sent as JSON numbers', () => {
      const result = handleMessage(
        quoteFrame({ m: 100.5, b: 100, a: 101, bv: 10, av: 20, lp: 100.25, t: T }),
      )

      expect(result).toHaveLength(2)
      expect(result[0].response).toEqual({
        result: 100.25,
        data,
        timestamps: { providerIndicatedTimeUnixMs: T },
      })
    })

    it('accepts surrounding whitespace and exponent notation', () => {
      const result = handleMessage(quoteFrame({ m: ' 100.5 ', lp: '1.0025e2' }))

      expect(result[0].response.data.mid_price).toBe(100.5)
      expect(result[0].response.result).toBe(100.25)
    })

    it('does not require the last traded price to be inside the spread', () => {
      const result = handleMessage(quoteFrame({ lp: '250' }))

      expect(result[0].response.result).toBe(250)
      expect(result[0].response.data.last_price).toBe(250)
    })

    describe('mid and last traded price', () => {
      it.each(invalidPrices)('rejects the frame when m is present but %s', (_, m) => {
        expectDropped(quoteFrame({ m }))
      })

      it.each(missingPrices)('computes mid from bid and ask when m is %s', (_, m) => {
        const result = handleMessage(quoteFrame({ m, b: '100', a: '102' }))

        expect(result).toHaveLength(2)
        expect(result[0].response.data).toEqual({
          ...data,
          mid_price: 101,
          bid_price: 100,
          ask_price: 102,
        })
      })

      it.each([
        ['b', without(quoteFrame(), 'm', 'b')],
        ['a', without(quoteFrame(), 'm', 'a')],
        ['b and a', without(quoteFrame(), 'm', 'b', 'a')],
      ])('rejects the frame when m and %s are missing', (_, message) => {
        expectDropped(message)
      })

      it.each([...missingPrices, ...invalidPrices])('rejects the frame when lp is %s', (_, lp) => {
        expectDropped(quoteFrame({ lp }))
      })
    })

    describe('bid and ask price', () => {
      it.each(missingPrices)('falls back to mid when b is %s', (_, b) => {
        const result = handleMessage(quoteFrame({ b }))

        expect(result).toHaveLength(2)
        expect(result[0].response.data).toEqual({ ...data, bid_price: 100.5 })
      })

      it.each(missingPrices)('falls back to mid when a is %s', (_, a) => {
        const result = handleMessage(quoteFrame({ a }))

        expect(result).toHaveLength(2)
        expect(result[0].response.data).toEqual({ ...data, ask_price: 100.5 })
      })

      it('falls back to mid for both when b and a are missing', () => {
        const result = handleMessage(without(quoteFrame(), 'b', 'a'))

        expect(result[0].response.data).toEqual({ ...data, bid_price: 100.5, ask_price: 100.5 })
      })

      it.each(invalidPrices)('rejects rather than falls back when b is present but %s', (_, b) => {
        expectDropped(quoteFrame({ b }))
      })

      it.each(invalidPrices)('rejects rather than falls back when a is present but %s', (_, a) => {
        expectDropped(quoteFrame({ a }))
      })

      it('rejects a bid above mid', () => {
        expectDropped(quoteFrame({ b: '100.51' }))
      })

      it('rejects an ask below mid', () => {
        expectDropped(quoteFrame({ a: '100.49' }))
      })

      it('rejects a crossed book', () => {
        expectDropped(quoteFrame({ b: '101', a: '100' }))
      })

      it('accepts bid and ask equal to mid', () => {
        const result = handleMessage(quoteFrame({ b: '100.5', a: '100.5' }))

        expect(result).toHaveLength(2)
        expect(result[0].response.data).toEqual({ ...data, bid_price: 100.5, ask_price: 100.5 })
      })

      it('compares prices numerically rather than as strings', () => {
        // As strings '9' > '10.5', as numbers 9 < 10.5 < 100
        const result = handleMessage(quoteFrame({ b: '9', m: '10.5', a: '100', lp: '10' }))

        expect(result).toHaveLength(2)
        expect(result[0].response.data).toMatchObject({
          bid_price: 9,
          mid_price: 10.5,
          ask_price: 100,
        })
      })
    })

    describe('bid and ask volume', () => {
      it.each(invalidVolumes)(
        'only answers requireVolume=false, with a null bid volume, when bv is %s',
        (_, bv) => {
          const result = handleMessage(quoteFrame({ bv }))

          expect(result).toEqual([
            {
              params: { ...params, requireVolume: false },
              response: {
                result: 100.25,
                data: { ...data, bid_volume: NaN },
                timestamps: { providerIndicatedTimeUnixMs: T },
              },
            },
          ])
        },
      )

      it.each(invalidVolumes)(
        'only answers requireVolume=false, with a null ask volume, when av is %s',
        (_, av) => {
          const result = handleMessage(quoteFrame({ av }))

          expect(result).toEqual([
            {
              params: { ...params, requireVolume: false },
              response: {
                result: 100.25,
                data: { ...data, ask_volume: NaN },
                timestamps: { providerIndicatedTimeUnixMs: T },
              },
            },
          ])
        },
      )

      it('only answers requireVolume=false when both volumes are missing', () => {
        const result = handleMessage(without(quoteFrame(), 'bv', 'av'))

        expect(result).toHaveLength(1)
        expect(result[0].params.requireVolume).toBe(false)
        expect(result[0].response.data).toEqual({ ...data, bid_volume: NaN, ask_volume: NaN })
      })

      it('treats zero as a valid volume', () => {
        const result = handleMessage(quoteFrame({ bv: '0', av: 0 }))

        expect(result).toHaveLength(2)
        expect(result[1].params.requireVolume).toBe(true)
        expect(result[1].response.data).toEqual({ ...data, bid_volume: 0, ask_volume: 0 })
      })

      it('accepts fractional volumes', () => {
        const result = handleMessage(quoteFrame({ bv: '0.5', av: '1.25' }))

        expect(result).toHaveLength(2)
        expect(result[1].response.data).toEqual({ ...data, bid_volume: 0.5, ask_volume: 1.25 })
      })
    })

    describe('timestamp', () => {
      it.each([
        ['missing', undefined],
        ['null', null],
      ])('omits timestamps when t is %s', (_, t) => {
        const result = handleMessage(quoteFrame({ t }))

        expect(result).toHaveLength(2)
        expect(result[0].response).toEqual({ result: 100.25, data })
        expect(result[0].response).not.toHaveProperty('timestamps')
      })

      it.each(invalidTimestamps)('rejects the frame when t is %s', (_, t) => {
        expectDropped(quoteFrame({ t }))
      })

      it.each([
        ['first ms of year 2001', Date.UTC(2001, 0, 1)],
        ['last ms of year 2099', Date.UTC(2100, 0, 1) - 1],
      ])('accepts %s', (_, t) => {
        const result = handleMessage(quoteFrame({ t: String(t) }))

        expect(result[0].response.timestamps).toEqual({ providerIndicatedTimeUnixMs: t })
      })
    })
  })

  describe('value frames', () => {
    const indexParams = { base: 'Index:US:SPX', quote: 'USD' }
    const data = {
      mid_price: 5000.5,
      bid_price: 5000.5,
      bid_volume: NaN,
      ask_price: 5000.5,
      ask_volume: NaN,
      last_price: 5000.5,
    }

    it('uses v for every price, null volumes, and errors requireVolume=true', () => {
      expect(handleMessage(valueFrame())).toEqual([
        {
          params: { ...indexParams, requireVolume: true },
          response: {
            statusCode: 502,
            errorMessage: 'Index:US:SPX/USD does not support bid/ask volume',
          },
        },
        {
          params: { ...indexParams, requireVolume: false },
          response: {
            result: 5000.5,
            data,
            timestamps: { providerIndicatedTimeUnixMs: T },
          },
        },
      ])
    })

    it('ignores quote fields on a value frame', () => {
      const result = handleMessage(
        valueFrame({ m: '1', b: '2', a: '3', bv: '4', av: '5', lp: '6' }),
      )

      expect(result[0].response.statusCode).toBe(502)
      expect(result[1].response.data).toEqual(data)
    })

    it('accepts v sent as a JSON number', () => {
      expect(handleMessage(valueFrame({ v: 5000.5 }))[1].response.result).toBe(5000.5)
    })

    it.each([...missingPrices, ...invalidPrices])('rejects the frame when v is %s', (_, v) => {
      expectDropped(valueFrame({ v }))
    })

    it.each([
      ['missing', undefined],
      ['null', null],
    ])('omits timestamps when t is %s', (_, t) => {
      const result = handleMessage(valueFrame({ t }))

      expect(result[1].response).toEqual({ result: 5000.5, data })
      expect(result[1].response).not.toHaveProperty('timestamps')
    })

    it.each(invalidTimestamps)('rejects the frame when t is %s', (_, t) => {
      expectDropped(valueFrame({ t }))
    })
  })

  describe('invalidPairs', () => {
    it('unblocks a pair when a valid quote frame arrives for it', () => {
      handleMessage({ message: `pair not found: ${PAIR}` })
      expect(invalidPairs.has(PAIR)).toBe(true)

      handleMessage(quoteFrame())
      expect(invalidPairs.has(PAIR)).toBe(false)
    })

    it('unblocks a pair when a valid value frame arrives for it', () => {
      handleMessage({ message: 'pair not found: Index:US:SPX/USD' })
      expect(invalidPairs.has('Index:US:SPX/USD')).toBe(true)

      handleMessage(valueFrame())
      expect(invalidPairs.has('Index:US:SPX/USD')).toBe(false)
    })

    it('unblocks a pair when the quote frame has no usable volume', () => {
      invalidPairs.add(PAIR)

      handleMessage(without(quoteFrame(), 'bv', 'av'))
      expect(invalidPairs.has(PAIR)).toBe(false)
    })

    it('unblocks a pair regardless of the casing of c', () => {
      invalidPairs.add(PAIR)

      handleMessage(quoteFrame({ c: 'Equity:us:aapl/usd' }))
      expect(invalidPairs.has(PAIR)).toBe(false)
    })

    it.each([
      ['invalid mid', quoteFrame({ m: '0' })],
      ['invalid bid', quoteFrame({ b: 'abc' })],
      ['invalid last traded price', quoteFrame({ lp: 'abc' })],
      ['no mid and no bid/ask pair', without(quoteFrame(), 'm', 'b')],
      ['bid above mid', quoteFrame({ b: '200' })],
      ['invalid timestamp', quoteFrame({ t: 'abc' })],
      ['unknown k', quoteFrame({ k: 'trade' })],
    ])('keeps a pair blocked when the quote frame has %s', (_, message) => {
      invalidPairs.add(PAIR)

      expect(handleMessage(message)).toBeUndefined()
      expect(invalidPairs.has(PAIR)).toBe(true)
    })

    it.each([
      ['invalid v', valueFrame({ v: '0' })],
      ['invalid timestamp', valueFrame({ t: 'abc' })],
    ])('keeps a pair blocked when the value frame has %s', (_, message) => {
      invalidPairs.add('Index:US:SPX/USD')

      expect(handleMessage(message)).toBeUndefined()
      expect(invalidPairs.has('Index:US:SPX/USD')).toBe(true)
    })

    it('only unblocks the pair the frame is for', () => {
      invalidPairs.add(PAIR)
      invalidPairs.add('Equity:US:FAKE/USD')

      handleMessage(quoteFrame())
      expect(Array.from(invalidPairs)).toEqual(['Equity:US:FAKE/USD'])
    })
  })
})
