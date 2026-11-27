import { extractFutureFields } from '../../src/lib/futures'
import { WSResponse } from '../../src/transport/stock_quotes'

const newYorkConfig = {
  ROLL_DATE_TIMEZONE: 'America/New_York',
  ROLL_DATE_TIME_SECONDS: 0,
}

const utcConfig = {
  ROLL_DATE_TIMEZONE: 'UTC',
  ROLL_DATE_TIME_SECONDS: 0,
}

const makeMessage = (overrides: Partial<WSResponse> = {}): WSResponse => ({
  type: 'quote',
  channel: 'futures.quotes',
  asset: 'futures',
  symbol: 'CME:ES',
  bid: '5000',
  ask: '5001',
  mid: '5000.5',
  session: 'regular',
  bid_size: '10',
  ask_size: '11',
  ts: 123456789,
  price: '5000.5',
  last_trade_date: '2026-12-18',
  roll_date: '2026-11-20',
  contract_month: '2026-12',
  trading_day_of_month: 15,
  trading_days_in_month: 22,
  ...overrides,
})

// Midnight of the given date in the given UTC offset, in unix seconds.
const startOfDaySeconds = (date: string, utcOffset: string) =>
  new Date(`${date}T00:00:00${utcOffset}`).getTime() / 1000

describe('extractFutureFields', () => {
  it('should extract all fields from a futures message', () => {
    const message = makeMessage()

    expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({
      mid_price: 5000.5,
      contract_month: 12,
      // November and December are EST (-05:00).
      expiry_date: startOfDaySeconds('2026-12-18', '-05:00'),
      roll_date: startOfDaySeconds('2026-11-20', '-05:00'),
      trading_day_of_month: 15,
      price_goldman_roll: 5000.5,
      price_goldman_continuous_roll: 5000.5,
    })
  })

  it('should fall back to the calculated mid price when the provider price is missing', () => {
    const message = makeMessage({ price: undefined })

    expect(extractFutureFields(message, 123.5, newYorkConfig)).toEqual(
      expect.objectContaining({
        mid_price: 123.5,
        price_goldman_roll: 123.5,
        price_goldman_continuous_roll: 123.5,
      }),
    )
  })

  it('should fall back to the calculated mid price when the provider price is not a number', () => {
    const message = makeMessage({ price: 'not-a-number' })

    expect(extractFutureFields(message, 123.5, newYorkConfig)).toEqual(
      expect.objectContaining({
        mid_price: 123.5,
        price_goldman_roll: 123.5,
        price_goldman_continuous_roll: 123.5,
      }),
    )
  })

  it('should accept a numeric provider price', () => {
    const message = makeMessage({ price: 4321.5 as unknown as string })

    expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
      expect.objectContaining({
        mid_price: 4321.5,
        price_goldman_roll: 4321.5,
        price_goldman_continuous_roll: 4321.5,
      }),
    )
  })

  describe('dates', () => {
    it('should use last_trade_date for the expiry date and roll_date for the roll date', () => {
      const message = makeMessage({ last_trade_date: '2026-12-18', roll_date: '2026-11-20' })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({
          // November and December are EST (-05:00).
          expiry_date: startOfDaySeconds('2026-12-18', '-05:00'),
          roll_date: startOfDaySeconds('2026-11-20', '-05:00'),
        }),
      )
    })

    it('should convert the expiry date to midnight in the configured timezone', () => {
      const message = makeMessage({ last_trade_date: '2026-12-18' })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({
          expiry_date: startOfDaySeconds('2026-12-18', '-05:00'),
        }),
      )
    })

    it('should convert the roll date to midnight in the configured timezone', () => {
      const message = makeMessage({ roll_date: '2026-11-20' })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({
          roll_date: startOfDaySeconds('2026-11-20', '-05:00'),
        }),
      )
    })

    it('should handle daylight saving time', () => {
      const message = makeMessage({ last_trade_date: '2026-07-21', roll_date: '2026-07-21' })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({
          // July is EDT (-04:00).
          expiry_date: startOfDaySeconds('2026-07-21', '-04:00'),
          roll_date: startOfDaySeconds('2026-07-21', '-04:00'),
        }),
      )
    })

    it('should respect a non-default timezone', () => {
      const message = makeMessage({ last_trade_date: '2026-12-18', roll_date: '2026-11-20' })

      expect(extractFutureFields(message, 100, utcConfig)).toEqual(
        expect.objectContaining({
          expiry_date: startOfDaySeconds('2026-12-18', 'Z'),
          roll_date: startOfDaySeconds('2026-11-20', 'Z'),
        }),
      )
    })

    it('should apply ROLL_DATE_TIME_SECONDS to the roll date but not the expiry date', () => {
      const message = makeMessage({ last_trade_date: '2026-12-18', roll_date: '2026-11-20' })
      const offset = 5 * 60 * 60

      const fields = extractFutureFields(message, 100, {
        ...newYorkConfig,
        ROLL_DATE_TIME_SECONDS: offset,
      })

      expect(fields).toEqual(
        expect.objectContaining({
          expiry_date: startOfDaySeconds('2026-12-18', '-05:00'),
          roll_date: startOfDaySeconds('2026-11-20', '-05:00') + offset,
        }),
      )
    })

    it('should return an empty object when last_trade_date is missing', () => {
      const message = makeMessage({ last_trade_date: undefined })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should return an empty object when last_trade_date is invalid', () => {
      const message = makeMessage({ last_trade_date: '18/12/2026' })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should return an empty object when roll_date is missing', () => {
      const message = makeMessage({ roll_date: undefined })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should return an empty object when roll_date is invalid', () => {
      const message = makeMessage({ roll_date: '20/11/2026' })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })
  })

  describe('contract_month', () => {
    it.each([
      ['2026-01', 1],
      ['2026-09', 9],
      ['2026-1', 1],
      ['2026-12', 12],
    ])('should parse %s as month %i', (contract_month, contractMonth) => {
      const message = makeMessage({ contract_month })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({ contract_month: contractMonth }),
      )
    })

    it.each([['2026-00'], ['2026-13'], ['2026'], ['2026-AB'], ['December'], ['']])(
      'should return an empty object for contract_month %p',
      (contract_month) => {
        const message = makeMessage({ contract_month })

        expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
      },
    )

    it('should return an empty object when contract_month is missing', () => {
      const message = makeMessage({ contract_month: undefined })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })
  })

  describe('trading_day_of_month', () => {
    it.each([0, 1, 15, 22])('should accept %i', (trading_day_of_month) => {
      const message = makeMessage({ trading_day_of_month })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({ trading_day_of_month }),
      )
    })

    it.each([23, 32, -1])('should return an empty object for %i', (trading_day_of_month) => {
      const message = makeMessage({ trading_day_of_month })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should return an empty object when trading_day_of_month is missing', () => {
      const message = makeMessage({ trading_day_of_month: undefined })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })
  })

  describe('trading_days_in_month', () => {
    it('should accept a trading_day_of_month equal to trading_days_in_month', () => {
      const message = makeMessage({ trading_day_of_month: 20, trading_days_in_month: 20 })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({ trading_day_of_month: 20 }),
      )
    })

    it('should return an empty object when trading_day_of_month exceeds trading_days_in_month', () => {
      const message = makeMessage({ trading_day_of_month: 21, trading_days_in_month: 20 })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should accept a numeric string trading_days_in_month', () => {
      const message = makeMessage({
        trading_day_of_month: 20,
        trading_days_in_month: '20' as unknown as number,
      })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({ trading_day_of_month: 20 }),
      )
    })

    it('should return an empty object when trading_days_in_month is missing', () => {
      const message = makeMessage({ trading_days_in_month: undefined })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it.each([[0], [-1], ['n/a' as unknown as number]])(
      'should return an empty object when trading_days_in_month is %p',
      (trading_days_in_month) => {
        const message = makeMessage({ trading_days_in_month })

        expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
      },
    )
  })

  describe('goldman roll prices', () => {
    const rolls = {
      r5: { price: '6001' },
      r5c: { price: '6002' },
    }

    it.each(['CME:ES.C1', 'CME:ES.C2', 'CME:ES.C3'])(
      'should use the roll prices for %s',
      (symbol) => {
        const message = makeMessage({ symbol, rolls })

        expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
          expect.objectContaining({
            mid_price: 5000.5,
            price_goldman_roll: 6001,
            price_goldman_continuous_roll: 6002,
          }),
        )
      },
    )

    it('should use the mid price for symbols without a roll suffix', () => {
      const message = makeMessage({ symbol: 'CME:ES', rolls })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({
          price_goldman_roll: 5000.5,
          price_goldman_continuous_roll: 5000.5,
        }),
      )
    })

    it('should use the mid price for C4 and beyond', () => {
      const message = makeMessage({ symbol: 'CME:ES.C4', rolls })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({
          price_goldman_roll: 5000.5,
          price_goldman_continuous_roll: 5000.5,
        }),
      )
    })

    it('should not match a multi-digit roll suffix', () => {
      const message = makeMessage({ symbol: 'CME:ES.C10', rolls })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual(
        expect.objectContaining({
          price_goldman_roll: 5000.5,
          price_goldman_continuous_roll: 5000.5,
        }),
      )
    })

    it('should return an empty object when rolls are missing for a roll-contract symbol', () => {
      const message = makeMessage({ symbol: 'CME:ES.C1', rolls: undefined })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should return an empty object when r5 is missing', () => {
      const message = makeMessage({ symbol: 'CME:ES.C1', rolls: { r5c: { price: '6002' } } })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should return an empty object when r5c is missing', () => {
      const message = makeMessage({ symbol: 'CME:ES.C1', rolls: { r5: { price: '6001' } } })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })

    it('should return an empty object when a roll price is not a number', () => {
      const message = makeMessage({
        symbol: 'CME:ES.C1',
        rolls: { r5: { price: 'n/a' }, r5c: { price: '6002' } },
      })

      expect(extractFutureFields(message, 100, newYorkConfig)).toEqual({})
    })
  })
})
