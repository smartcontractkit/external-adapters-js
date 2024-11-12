import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://app.pinkswantrading.com', {
    encodedQueryParams: true,
    reqheaders: {
      'x-oracle': 'fake-api-key',
    },
  })
    .get('/graphql', {
      query:
        'query ChainlinkIv($symbol: SymbolEnumType){ChainlinkIv(symbol: $symbol){oneDayIv twoDayIv sevenDayIv fourteenDayIv twentyOneDayIv twentyEightDayIv}}',
      variables: { symbol: 'ETH' },
    })
    .reply(
      200,
      () => ({
        data: {
          ChainlinkIv: [
            {
              oneDayIv: 89.31,
              twoDayIv: 88.3,
              sevenDayIv: 90.26,
              fourteenDayIv: 92.54,
              twentyOneDayIv: 97.43,
              twentyEightDayIv: 99.82,
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
