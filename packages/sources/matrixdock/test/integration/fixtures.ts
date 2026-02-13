import nock from 'nock'

export const mockNavResponseSuccess = (): nock.Scope =>
  nock('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'XAUM' })
    .reply(200, {
      code: 0,
      message: 'success',
      data: {
        round_id: '7424696115074699264',
        last_updated_timestamp: 1770185497979,
        symbol: 'XAUM',
        issue_price: '5115.355',
        redeem_price: '5037.982',
      },
    })

export const mockNavResponseInvalidSymbol = (): nock.Scope =>
  nock('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'INVALID' })
    .reply(200, {
      code: 1001,
      message: 'Invalid symbol',
      data: null,
    })

export const mockNavResponseInternalServerError = (): nock.Scope =>
  nock('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'XAUM_ERROR' })
    .reply(200, {
      code: 5001,
      message: 'System busy, please try again later.',
      data: null,
    })

export const mockNavResponseCustomSymbol = (): nock.Scope =>
  nock('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'XAGU' })
    .reply(200, {
      code: 0,
      message: 'success',
      data: {
        round_id: '7424696115074699265',
        last_updated_timestamp: 1770185497980,
        symbol: 'XAGU',
        issue_price: '28.50',
        redeem_price: '28.25',
      },
    })
