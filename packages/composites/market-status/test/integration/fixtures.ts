import nock from 'nock'

export const mockOpen = (market: string, url?: string, type = 'regular', weekend?: string) =>
  nock(url || '')
    .post('/', { data: { endpoint: 'market-status', market, type, weekend } })
    .reply(200, {
      result: 2,
      statusCode: 200,
      data: {
        result: 2,
        statusString: 'OPEN',
      },
    })
    .persist()

export const mockClosed = (market: string, url?: string, type = 'regular', weekend?: string) =>
  nock(url || '')
    .post('/', { data: { endpoint: 'market-status', market, type, weekend } })
    .reply(200, {
      result: 1,
      statusCode: 200,
      data: {
        result: 1,
        statusString: 'CLOSED',
      },
    })
    .persist()

export const mockUnknown = (market: string, url?: string, type = 'regular', weekend?: string) =>
  nock(url || '')
    .post('/', { data: { endpoint: 'market-status', market, type, weekend } })
    .reply(200, {
      result: 0,
      statusCode: 200,
      data: {
        result: 0,
        statusString: 'UNKNOWN',
      },
    })
    .persist()

export const mockError = (market: string, url?: string, type = 'regular', weekend?: string) =>
  nock(url || '')
    .post('/', { data: { endpoint: 'market-status', market, type, weekend } })
    .reply(500, {})
    .persist()
