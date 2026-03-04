import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { parseMarketStatus } from '../../src/transport/market-status'

describe('parseMarketStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('return UNKNOWN when all data values are null', () => {
    expect(parseMarketStatus({} as any)).toStrictEqual({
      status: MarketStatus.UNKNOWN,
      string: 'UNKNOWN',
    })
  })

  it('return OPEN when session is regular', () => {
    expect(
      parseMarketStatus({
        session: 'regular',
      } as any),
    ).toStrictEqual({
      status: MarketStatus.OPEN,
      string: 'OPEN',
    })
  })

  it('return CLOSED when session is not regular', () => {
    expect(
      parseMarketStatus({
        session: 'pre-market',
      } as any),
    ).toStrictEqual({
      status: MarketStatus.CLOSED,
      string: 'CLOSED',
    })
  })

  it('return CLOSED when session is null', () => {
    expect(
      parseMarketStatus({
        exchange: '123',
        session: null,
      } as any),
    ).toStrictEqual({
      status: MarketStatus.CLOSED,
      string: 'CLOSED',
    })
  })
})
