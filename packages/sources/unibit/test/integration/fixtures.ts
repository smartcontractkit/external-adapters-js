import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.unibit.ai/v2/stock', {
    encodedQueryParams: true,
  })
    .get('/historical')
    .query({ accessKey: 'fake-api-key', tickers: 'VXX' })
    .reply(
      200,
      () => ({
        meta_data: {
          api_name: 'historical_stock_price_v2',
          num_total_data_points: 1,
          credit_cost: 10,
          start_date: 'yesterday',
          end_date: 'yesterday',
        },
        result_data: {
          VXX: [
            {
              date: '2021-11-26',
              volume: 82949400,
              high: 26.44,
              low: 22.625,
              adj_close: 26.16,
              close: 26.16,
              open: 22.97,
            },
          ],
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
