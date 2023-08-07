import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://bitex.la/api', {
    encodedQueryParams: true,
  })
    .get('/tickers/ETH_ARS')
    .reply(
      200,
      () => ({
        data: {
          id: 'eth_ars',
          type: 'tickers',
          attributes: {
            last: 935234.0,
            open: 934713,
            high: 935234,
            low: 907110,
            vwap: 934877.7183770883,
            volume: 1.257,
            bid: 879407,
            ask: 930127,
            price_before_last: 920016,
          },
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )

export const mockResponseFailure = (): nock.Scope =>
  nock('https://bitex.la/api', {
    encodedQueryParams: true,
  })
    .get('/tickers/NON_EXISTING')
    .reply(
      404,
      () => ({
        errors: [{ code: 'not_found', detail: 'Orderbook with code NONEXISTING not found' }],
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
