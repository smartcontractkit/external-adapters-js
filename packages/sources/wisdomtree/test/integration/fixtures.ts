import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataspanapi.wisdomtree.com', {
    encodedQueryParams: true,
    reqheaders: {
      'x-wt-dataspan-key': 'SOME_API_KEY',
    },
  })
    .get('/funddetails/nav/')
    .query({
      ticker: 'WTGXX',
    })
    .reply(
      200,
      () => ({
        ticker: 'WTGXX',
        relatedTicker: null,
        name: 'WisdomTree Government Money Market Digital Fund',
        dt: '2025-06-18',
        nav: 1.0,
        sharesOutstanding: 320324457.111,
        aum: 320324.45711,
        navPrevious: 1.0,
        navDelta: 0.0,
        navDeltaPCT: 0.0,
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
    .persist()
