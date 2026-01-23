import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://data-engine', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({
      data: {
        midPrice: '4869500000000000000000',
        marketStatus: 2,
        decimals: 18,
      },
      statusCode: 200,
    }))
    .persist()
